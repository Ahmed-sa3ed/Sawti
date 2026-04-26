import { useState } from "react";
import {
  useAdminListRecordings,
  useAdminUpdateRecordingStatus,
  useAdminAcceptAllRecordings,
  useAdminGetOrphanedRecordings,
  useAdminDeleteOrphanedRecordings,
  getAdminListRecordingsQueryKey,
  getAdminGetDashboardQueryKey,
  getAdminListSessionsQueryKey,
  getAdminListUsersQueryKey,
  getAdminGetOrphanedRecordingsQueryKey,
} from "@workspace/api-client-react";
import type { AcceptAllRecordingsResponse, DeleteOrphanedRecordingsResponse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Play, Pause, CheckCheck, AlertTriangle, Trash2, SearchX, Loader2, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRecordings() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [orphanCheckEnabled, setOrphanCheckEnabled] = useState(false);

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: recordings, isLoading } = useAdminListRecordings(queryParams);
  const { data: pendingRecordings } = useAdminListRecordings({ status: "pending" });
  const updateStatus = useAdminUpdateRecordingStatus();
  const acceptAll = useAdminAcceptAllRecordings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: orphanedData,
    isFetching: isCheckingOrphans,
    isSuccess: orphanCheckDone,
  } = useAdminGetOrphanedRecordings({
    query: { enabled: orphanCheckEnabled, queryKey: getAdminGetOrphanedRecordingsQueryKey() },
  });

  const deleteOrphaned = useAdminDeleteOrphanedRecordings();
  const orphanedSet = new Set(orphanedData?.orphanedIds ?? []);
  const orphanedCount = orphanedData?.orphanedIds.length ?? 0;

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<Record<number, HTMLAudioElement>>({});
  const [audioErrors, setAudioErrors] = useState<Record<number, boolean>>({});

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const allIds = (recordings ?? []).map((r) => r.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  // Which selected recordings are downloaded (eligible for deletion)
  const selectedDownloadedIds = (recordings ?? [])
    .filter((r) => selectedIds.has(r.id) && (r as unknown as { downloadedAt: string | null }).downloadedAt)
    .map((r) => r.id);

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListRecordingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAdminGetOrphanedRecordingsQueryKey() });
  };

  const togglePlay = (id: number) => {
    if (audioErrors[id]) return;
    if (playingId === id) {
      audioElements[id].pause();
      setPlayingId(null);
      return;
    }
    if (playingId && audioElements[playingId]) {
      audioElements[playingId].pause();
    }
    let audio = audioElements[id];
    if (!audio) {
      audio = new Audio(`/api/admin/recordings/${id}/audio`);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setAudioErrors(prev => ({ ...prev, [id]: true }));
        setPlayingId(null);
      };
      setAudioElements(prev => ({ ...prev, [id]: audio }));
    }
    audio.play().then(() => {
      setPlayingId(id);
    }).catch(e => {
      console.error("Audio playback error:", e);
      setAudioErrors(prev => ({ ...prev, [id]: true }));
      setPlayingId(null);
    });
  };

  const handleUpdateStatus = (id: number, status: "accepted" | "rejected") => {
    updateStatus.mutate({ recordingId: id, data: { status } }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: status === "accepted" ? "تم قبول التسجيل" : "تم رفض التسجيل" });
      }
    });
  };

  const handleBulkStatus = async (status: "accepted" | "rejected") => {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    try {
      const res = await fetch("/api/admin/recordings/bulk/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
        credentials: "include",
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: d.error ?? "فشل التحديث الجماعي", variant: "destructive" });
      } else {
        toast({ title: d.message });
        invalidateAll();
        setSelectedIds(new Set());
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDownloadedIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedDownloadedIds.length} تسجيل من قاعدة البيانات والخادم؟`)) return;
    setBulkWorking(true);
    try {
      const res = await fetch("/api/admin/recordings/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedDownloadedIds }),
        credentials: "include",
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: d.error ?? "فشل الحذف", variant: "destructive" });
      } else {
        toast({ title: d.message });
        invalidateAll();
        setSelectedIds(new Set());
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setBulkWorking(false);
    }
  };

  const handleAcceptAll = () => {
    const pending = pendingRecordings ?? [];
    if (pending.length === 0) return;
    if (!confirm(`هل أنت متأكد من قبول ${pending.length} تسجيل معلق؟`)) return;
    acceptAll.mutate(undefined, {
      onSuccess: (data: AcceptAllRecordingsResponse) => {
        invalidateAll();
        toast({ title: data.message });
      },
      onError: () => toast({ title: "فشل في قبول التسجيلات", variant: "destructive" }),
    });
  };

  const handleCheckOrphans = () => {
    if (orphanCheckEnabled) {
      queryClient.invalidateQueries({ queryKey: getAdminGetOrphanedRecordingsQueryKey() });
    } else {
      setOrphanCheckEnabled(true);
    }
  };

  const handleDeleteOrphaned = () => {
    if (!confirm(`هل أنت متأكد من حذف ${orphanedCount} تسجيل يتيم؟`)) return;
    deleteOrphaned.mutate(undefined, {
      onSuccess: (data: DeleteOrphanedRecordingsResponse) => {
        invalidateAll();
        toast({ title: data.message });
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "فشل في حذف التسجيلات اليتيمة";
        toast({ title: "فشل في حذف التسجيلات اليتيمة", description: message, variant: "destructive" });
      },
    });
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  const pendingCount = pendingRecordings?.length ?? 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-primary">التسجيلات</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <Button
              variant="outline"
              className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
              onClick={handleAcceptAll}
              disabled={acceptAll.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              {acceptAll.isPending ? "جاري القبول..." : `قبول الكل (${pendingCount})`}
            </Button>
          )}

          <Button
            variant="outline"
            className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            onClick={handleCheckOrphans}
            disabled={isCheckingOrphans}
          >
            {isCheckingOrphans ? (
              <><Loader2 className="h-4 w-4 animate-spin" />جاري الفحص...</>
            ) : (
              <><SearchX className="h-4 w-4" />فحص اليتيمة</>
            )}
          </Button>

          {orphanCheckDone && orphanedCount > 0 && (
            <Button
              variant="outline"
              className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
              onClick={handleDeleteOrphaned}
              disabled={deleteOrphaned.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteOrphaned.isPending ? "جاري الحذف..." : `حذف اليتيمة (${orphanedCount})`}
            </Button>
          )}

          <div className="w-56">
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val as typeof statusFilter); setSelectedIds(new Set()); }}>
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">بانتظار المراجعة</SelectItem>
                <SelectItem value="accepted">مقبولة</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {orphanCheckDone && (
        <div className="flex flex-col gap-2">
          {(orphanedData?.errorCount ?? 0) > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {`تعذر فحص ${orphanedData!.errorCount} ملف بسبب خطأ في التخزين — قد تكون النتائج غير مكتملة`}
            </div>
          )}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border ${orphanedCount > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {orphanedCount > 0
              ? `تم اكتشاف ${orphanedCount} تسجيل يتيم (ملف الصوت مفقود)`
              : "لا توجد تسجيلات يتيمة — جميع الملفات الصوتية متاحة"}
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg flex-wrap">
          <span className="text-sm font-medium text-primary">
            تم تحديد {selectedIds.size} تسجيل
          </span>
          <div className="flex items-center gap-2 mr-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => handleBulkStatus("accepted")}
              disabled={bulkWorking}
            >
              {bulkWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              قبول المحدد
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => handleBulkStatus("rejected")}
              disabled={bulkWorking}
            >
              {bulkWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              رفض المحدد
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`gap-1.5 ${selectedDownloadedIds.length > 0 ? "border-red-400 text-red-700 hover:bg-red-50" : "border-slate-200 text-slate-400 cursor-not-allowed"}`}
              onClick={handleBulkDelete}
              disabled={bulkWorking || selectedDownloadedIds.length === 0}
              title={selectedDownloadedIds.length === 0 ? "الحذف متاح فقط للتسجيلات التي تم تنزيلها" : `حذف ${selectedDownloadedIds.length} تسجيل تم تنزيله`}
            >
              {bulkWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              حذف المُنزَّل ({selectedDownloadedIds.length})
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-right">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  title="تحديد الكل"
                />
              </TableHead>
              <TableHead className="text-right">الجملة</TableHead>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">الجلسة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">استماع</TableHead>
              <TableHead className="text-right w-[200px]">قرار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordings?.map((rec) => {
              const isOrphaned = orphanedSet.has(rec.id);
              const isChecked = selectedIds.has(rec.id);
              const isDownloaded = !!(rec as unknown as { downloadedAt: string | null }).downloadedAt;

              return (
                <TableRow
                  key={rec.id}
                  className={
                    isOrphaned ? "bg-red-50 border-red-100" :
                    isChecked ? "bg-primary/5" : undefined
                  }
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(rec.id)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isOrphaned && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 shrink-0 text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          يتيم
                        </Badge>
                      )}
                      {isDownloaded && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0 text-xs gap-1">
                          <Download className="h-3 w-3" />
                          تم التنزيل
                        </Badge>
                      )}
                      {rec.sentenceText}
                    </div>
                  </TableCell>
                  <TableCell>{rec.username}</TableCell>
                  <TableCell>{rec.sessionName}</TableCell>
                  <TableCell>
                    {rec.status === "pending" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">بانتظار المراجعة</Badge>}
                    {rec.status === "accepted" && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مقبولة</Badge>}
                    {rec.status === "rejected" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">مرفوضة</Badge>}
                  </TableCell>
                  <TableCell>
                    {isOrphaned || audioErrors[rec.id] ? (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-medium">الصوت غير متاح</span>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => togglePlay(rec.id)}>
                        {playingId === rec.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {isOrphaned || audioErrors[rec.id] ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 hover:bg-red-50 text-red-600 border-red-200"
                        onClick={() => handleUpdateStatus(rec.id, "rejected")}
                      >
                        <Trash2 className="h-4 w-4" /> رفض وحذف
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`gap-1 ${rec.status === 'accepted' ? 'bg-green-100' : 'hover:bg-green-50'}`}
                          onClick={() => handleUpdateStatus(rec.id, "accepted")}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" /> قبول
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`gap-1 ${rec.status === 'rejected' ? 'bg-red-100' : 'hover:bg-red-50'}`}
                          onClick={() => handleUpdateStatus(rec.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 text-red-600" /> رفض
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {recordings?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد تسجيلات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
