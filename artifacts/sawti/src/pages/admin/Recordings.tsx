import { useState } from "react";
import { useAdminListRecordings, useAdminUpdateRecordingStatus, useAdminAcceptAllRecordings, getAdminListRecordingsQueryKey, getAdminGetDashboardQueryKey, getAdminListSessionsQueryKey, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Play, Pause, CheckCheck, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRecordings() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  
  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: recordings, isLoading } = useAdminListRecordings(queryParams);
  const { data: pendingRecordings } = useAdminListRecordings({ status: "pending" });
  const updateStatus = useAdminUpdateRecordingStatus();
  const acceptAll = useAdminAcceptAllRecordings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<Record<number, HTMLAudioElement>>({});
  const [audioErrors, setAudioErrors] = useState<Record<number, boolean>>({});

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
        queryClient.invalidateQueries({ queryKey: getAdminListRecordingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: status === "accepted" ? "تم قبول التسجيل" : "تم رفض التسجيل" });
      }
    });
  };

  const handleAcceptAll = () => {
    const pending = pendingRecordings ?? [];
    if (pending.length === 0) return;
    if (!confirm(`هل أنت متأكد من قبول ${pending.length} تسجيل معلق؟`)) return;
    acceptAll.mutate(undefined, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getAdminListRecordingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: data.message });
      },
      onError: () => {
        toast({ title: "فشل في قبول التسجيلات", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  const pendingCount = pendingRecordings?.length ?? 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">التسجيلات</h1>
        
        <div className="flex items-center gap-3">
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
          <div className="w-64">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as "pending" | "accepted" | "rejected" | "all")}>
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الجملة</TableHead>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">الجلسة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">استماع</TableHead>
              <TableHead className="text-right w-[200px]">قرار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordings?.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell className="font-medium max-w-md">{rec.sentenceText}</TableCell>
                <TableCell>{rec.username}</TableCell>
                <TableCell>{rec.sessionName}</TableCell>
                <TableCell>
                  {rec.status === "pending" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">بانتظار المراجعة</Badge>}
                  {rec.status === "accepted" && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مقبولة</Badge>}
                  {rec.status === "rejected" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">مرفوضة</Badge>}
                </TableCell>
                <TableCell>
                  {audioErrors[rec.id] ? (
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
                  {audioErrors[rec.id] ? (
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
            ))}
            {recordings?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
