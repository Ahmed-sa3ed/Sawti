import { useAdminListSuggestions, useAdminUpdateSuggestion, getAdminListSuggestionsQueryKey, getAdminGetDashboardQueryKey, getAdminListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminSuggestions() {
  const { data: suggestions, isLoading } = useAdminListSuggestions();
  const updateSuggestion = useAdminUpdateSuggestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);

  if (isLoading) return <div>جاري التحميل...</div>;

  const pendingCount = suggestions?.filter((s) => s.isApproved === null && !s.isDuplicate).length ?? 0;

  const handleUpdate = (id: number, isApproved: boolean) => {
    updateSuggestion.mutate({ suggestionId: id, data: { isApproved } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListSuggestionsQueryKey() });
        toast({ title: isApproved ? "تم قبول الاقتراح" : "تم رفض الاقتراح" });
      }
    });
  };

  const handleAcceptAll = async () => {
    if (pendingCount === 0) return;
    if (!confirm(`هل أنت متأكد من قبول ${pendingCount} اقتراح وتحويلها إلى جلسات تسجيل؟`)) return;

    setIsAcceptingAll(true);
    try {
      const res = await fetch("/api/admin/suggestions/accept-all", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل في قبول الاقتراحات");

      queryClient.invalidateQueries({ queryKey: getAdminListSuggestionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
      toast({ title: data.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast({ title: "فشل العملية", description: msg, variant: "destructive" });
    } finally {
      setIsAcceptingAll(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">الاقتراحات</h1>

        {pendingCount > 0 && (
          <Button
            variant="outline"
            className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
            onClick={handleAcceptAll}
            disabled={isAcceptingAll}
          >
            <CheckCheck className="h-4 w-4" />
            {isAcceptingAll ? "جاري القبول..." : `قبول الكل وإنشاء جلسات (${pendingCount})`}
          </Button>
        )}
      </div>

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
