import { useState, useRef } from "react";
import { useAdminListSessions, getAdminListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UploadResult = {
  sessionsCreated: number;
  uniqueSentences: number;
  totalSentences: number;
};

export default function AdminSessions() {
  const { data: sessions, isLoading } = useAdminListSessions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "csv", "pdf", "docx"].includes(ext ?? "")) {
      setUploadError("نوع الملف غير مدعوم. المقبول: .txt .csv .pdf .docx");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "حدث خطأ أثناء الرفع");
      } else {
        setUploadResult(data);
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        toast({ title: data.message });
      }
    } catch {
      setUploadError("تعذر الاتصال بالخادم");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">الجلسات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ارفع ملف جمل — يقوم النظام بإنشاء الجلسات وتوزيع الجمل تلقائياً
          </p>
        </div>
        <button
          onClick={() => { resetDialog(); setDialogOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors shadow-sm"
        >
          <Upload className="h-4 w-4" />
          رفع ملف جمل
        </button>
      </div>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog(); }}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع ملف جمل وإنشاء جلسات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">كيف يعمل النظام:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>كل جملة في الملف تُكرَّر 3 مرات</li>
                <li>كل جلسة تحتوي على 50 جملة كحد أقصى</li>
                <li>لا تتكرر نفس الجملة داخل الجلسة الواحدة</li>
                <li>الجلسات تُرقَّم تلقائياً (جلسة 1، جلسة 2، ...)</li>
              </ul>
            </div>

            {/* File picker */}
            {!uploadResult && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} كيلوبايت
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="font-medium">اضغط لاختيار ملف</p>
                      <p className="text-sm text-muted-foreground">.txt · .csv · .pdf · .docx</p>
                    </div>
                  )}
                </button>

                {uploadError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جاري المعالجة...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> رفع وإنشاء الجلسات</>
                  )}
                </button>
              </>
            )}

            {/* Success result */}
            {uploadResult && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle className="h-14 w-14 text-green-500" />
                  <h3 className="text-xl font-bold text-foreground">تم بنجاح!</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "جلسات أُنشئت", value: uploadResult.sessionsCreated },
                    { label: "جمل فريدة", value: uploadResult.uniqueSentences },
                    { label: "إجمالي الجمل", value: uploadResult.totalSentences },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setDialogOpen(false); resetDialog(); }}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sessions table */}
      {(!sessions || sessions.length === 0) ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">لا توجد جلسات بعد</p>
          <p className="text-sm mt-1">ارفع ملف جمل لإنشاء الجلسات تلقائياً</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الجلسة</TableHead>
                <TableHead className="text-right">عدد الجمل</TableHead>
                <TableHead className="text-right">المستخدمين المعينين</TableHead>
                <TableHead className="text-right">التسجيلات</TableHead>
                <TableHead className="text-right">نسبة الإنجاز</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const pct = session.totalSentences > 0
                  ? Math.round((session.acceptedRecordings / session.totalSentences) * 100)
                  : 0;
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.name}</TableCell>
                    <TableCell>{session.totalSentences}</TableCell>
                    <TableCell>{session.assignedUsers}</TableCell>
                    <TableCell>
                      {session.totalRecordings > 0
                        ? `${session.acceptedRecordings} مقبولة / ${session.totalRecordings}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-24">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
