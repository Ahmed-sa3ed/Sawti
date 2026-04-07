import { useState } from "react";
import { useAdminListSessions, useAdminCreateSession, useAdminUploadSentences, getAdminListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderPlus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const sessionSchema = z.object({
  name: z.string().min(1, "مطلوب"),
  description: z.string().optional(),
});

const uploadSchema = z.object({
  sentences: z.string().min(1, "مطلوب"),
});

export default function AdminSessions() {
  const { data: sessions, isLoading } = useAdminListSessions();
  const createSession = useAdminCreateSession();
  const uploadSentences = useAdminUploadSentences();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState<number | null>(null);

  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { name: "", description: "" },
  });

  const uploadForm = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { sentences: "" },
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  const onCreateSession = (values: z.infer<typeof sessionSchema>) => {
    createSession.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        setCreateOpen(false);
        form.reset();
        toast({ title: "تم إنشاء الجلسة" });
      }
    });
  };

  const onUploadSentences = (sessionId: number, values: z.infer<typeof uploadSchema>) => {
    const sentences = values.sentences.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (sentences.length === 0) return;

    uploadSentences.mutate({ sessionId, data: { sentences } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        setUploadOpen(null);
        uploadForm.reset();
        toast({ title: `تم رفع ${data.count} جملة بنجاح` });
      }
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">الجلسات</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><FolderPlus className="h-4 w-4" /> إنشاء جلسة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء جلسة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateSession)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createSession.isPending}>إنشاء</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">عدد الجمل</TableHead>
              <TableHead className="text-right">المستخدمين المعينين</TableHead>
              <TableHead className="text-right">التسجيلات</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.name}</TableCell>
                <TableCell>{session.description || "-"}</TableCell>
                <TableCell>{session.totalSentences}</TableCell>
                <TableCell>{session.assignedUsers}</TableCell>
                <TableCell>
                  {session.totalRecordings > 0 ? (
                    <span>{session.acceptedRecordings} مقبولة من {session.totalRecordings}</span>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <Dialog open={uploadOpen === session.id} onOpenChange={(open) => setUploadOpen(open ? session.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Upload className="h-4 w-4" /> رفع جمل
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>رفع جمل لـ {session.name}</DialogTitle>
                      </DialogHeader>
                      <Form {...uploadForm}>
                        <form onSubmit={uploadForm.handleSubmit((values) => onUploadSentences(session.id, values))} className="space-y-4">
                          <FormField
                            control={uploadForm.control}
                            name="sentences"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>الجمل (كل جملة في سطر)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} className="h-64" dir="rtl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full" disabled={uploadSentences.isPending}>رفع</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
