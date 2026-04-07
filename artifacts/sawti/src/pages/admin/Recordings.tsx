import { useState } from "react";
import { useAdminListRecordings, useAdminUpdateRecordingStatus, getAdminListRecordingsQueryKey, getAdminGetDashboardQueryKey, getAdminListSessionsQueryKey, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRecordings() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  
  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: recordings, isLoading } = useAdminListRecordings(queryParams);
  const updateStatus = useAdminUpdateRecordingStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElements, setAudioElements] = useState<Record<number, HTMLAudioElement>>({});

  const togglePlay = (id: number, filePath: string) => {
    // If playing the same one, pause it
    if (playingId === id) {
      audioElements[id].pause();
      setPlayingId(null);
      return;
    }

    // Stop current playing
    if (playingId && audioElements[playingId]) {
      audioElements[playingId].pause();
    }

    // Play new one
    let audio = audioElements[id];
    if (!audio) {
      // In a real app this would use the proper API URL, but since we don't have it, 
      // we'll try to play the file directly or fallback
      audio = new Audio(`/api/admin/recordings/${id}/audio`);
      audio.onended = () => setPlayingId(null);
      setAudioElements(prev => ({ ...prev, [id]: audio }));
    }
    
    audio.play().catch(e => {
      console.error("Audio playback error:", e);
      toast({ title: "خطأ في تشغيل الملف الصوتي", variant: "destructive" });
      setPlayingId(null);
    });
    
    setPlayingId(id);
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

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">التسجيلات</h1>
        
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
                  <Button variant="ghost" size="icon" onClick={() => togglePlay(rec.id, rec.filePath)}>
                    {playingId === rec.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </TableCell>
                <TableCell>
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
