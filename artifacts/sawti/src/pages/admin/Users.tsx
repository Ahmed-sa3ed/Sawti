import { useState } from "react";
import { useAdminListUsers, useAdminCreateUser, useAdminDeleteUser, useAdminAssignSession, useAdminListSessions, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Trash2, UserPlus, FilePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  username: z.string().min(1, "مطلوب"),
  password: z.string().min(6, "6 أحرف على الأقل"),
});

const assignSchema = z.object({
  sessionId: z.coerce.number().min(1, "مطلوب"),
});

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminListUsers();
  const { data: sessions } = useAdminListSessions();
  const createUser = useAdminCreateUser();
  const deleteUser = useAdminDeleteUser();
  const assignSession = useAdminAssignSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<number | null>(null);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: "", password: "" },
  });

  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  const onCreateUser = (values: z.infer<typeof userSchema>) => {
    createUser.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        setCreateOpen(false);
        form.reset();
        toast({ title: "تم إنشاء المستخدم" });
      }
    });
  };

  const onAssignSession = (userId: number, values: z.infer<typeof assignSchema>) => {
    assignSession.mutate({ userId, data: { sessionId: values.sessionId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        setAssignOpen(null);
        assignForm.reset();
        toast({ title: "تم تعيين الجلسة" });
      }
    });
  };

  const onDeleteUser = (userId: number) => {
    if (confirm("هل أنت متأكد؟")) {
      deleteUser.mutate({ userId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          toast({ title: "تم حذف المستخدم" });
        }
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">المستخدمين</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> إضافة مستخدم</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} dir="ltr" className="text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createUser.isPending}>إضافة</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم المستخدم</TableHead>
              <TableHead className="text-right">التقدم</TableHead>
              <TableHead className="text-right">إجمالي الجمل</TableHead>
              <TableHead className="text-right">التسجيلات المنجزة</TableHead>
              <TableHead className="text-right">مقبولة / مرفوضة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.filter(u => u.role === 'user').map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={user.totalSentences > 0 ? (user.completedRecordings / user.totalSentences) * 100 : 0} className="w-[60%]" />
                    <span className="text-sm text-muted-foreground">
                      {user.totalSentences > 0 ? Math.round((user.completedRecordings / user.totalSentences) * 100) : 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>{user.totalSentences}</TableCell>
                <TableCell>{user.completedRecordings}</TableCell>
                <TableCell>
                  <span className="text-green-600">{user.acceptedRecordings}</span> / <span className="text-red-600">{user.rejectedRecordings}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog open={assignOpen === user.id} onOpenChange={(open) => setAssignOpen(open ? user.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <FilePlus className="h-4 w-4" /> تعيين جلسة
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle>تعيين جلسة لـ {user.username}</DialogTitle>
                        </DialogHeader>
                        <Form {...assignForm}>
                          <form onSubmit={assignForm.handleSubmit((values) => onAssignSession(user.id, values))} className="space-y-4">
                            <FormField
                              control={assignForm.control}
                              name="sessionId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>الجلسة</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger dir="rtl">
                                        <SelectValue placeholder="اختر الجلسة" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent dir="rtl">
                                      {sessions?.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.totalSentences} جملة)</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={assignSession.isPending}>تعيين</Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="icon" onClick={() => onDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
