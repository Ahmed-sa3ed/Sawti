import { useAdminListSuggestions, useAdminUpdateSuggestion, getAdminListSuggestionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSuggestions() {
  const { data: suggestions, isLoading } = useAdminListSuggestions();
  const updateSuggestion = useAdminUpdateSuggestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return <div>جاري التحميل...</div>;

  const handleUpdate = (id: number, isApproved: boolean) => {
    updateSuggestion.mutate({ suggestionId: id, data: { isApproved } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSuggestionsQueryKey() });
        toast({ title: isApproved ? "تم قبول الاقتراح" : "تم رفض الاقتراح" });
      }
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold text-primary">الاقتراحات</h1>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">النص</TableHead>
              <TableHead className="text-right">المقترح</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right w-[200px]">قرار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestions?.map((sug) => (
              <TableRow key={sug.id}>
                <TableCell className="font-medium max-w-md">{sug.text}</TableCell>
                <TableCell>{sug.username}</TableCell>
                <TableCell>
                  {sug.isDuplicate && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> مكرر
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {sug.isApproved === null && <Badge variant="outline">بانتظار المراجعة</Badge>}
                  {sug.isApproved === true && <Badge variant="outline" className="bg-green-50 text-green-700">مقبول</Badge>}
                  {sug.isApproved === false && <Badge variant="outline" className="bg-red-50 text-red-700">مرفوض</Badge>}
                </TableCell>
                <TableCell>
                  {sug.isApproved === null && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="hover:bg-green-50" onClick={() => handleUpdate(sug.id, true)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-red-50" onClick={() => handleUpdate(sug.id, false)}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {suggestions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا توجد اقتراحات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
