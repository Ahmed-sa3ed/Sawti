import { useState, useRef, Fragment } from "react";
import { useAdminListSessions, getAdminListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UploadResult = {
  sessionsCreated: number;
  uniqueSentences: number;
  totalSentences: number;
};

type Sentence = {
  id: number;
  text: string;
  orderIndex: number;
  assignedUserId: number | null;
};

type SessionRow = {
  id: number;
  name: string;
  totalSentences: number;
  assignedUsers: number;
  totalRecordings: number;
  acceptedRecordings: number;
};

export default function AdminSessions() {
  const { data: sessions, isLoading } = useAdminListSessions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sentencesMap, setSentencesMap] = useState<Record<number, Sentence[]>>({});
  const [loadingSentences, setLoadingSentences] = useState<number | null>(null);

  const [editSession, setEditSession] = useState<SessionRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetUploadDialog = () => {
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

  const toggleSentences = async (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (sentencesMap[sessionId]) return;
    setLoadingSentences(sessionId);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/sentences`, { credentials: "include" });
      const data = await res.json();
      setSentencesMap(prev => ({ ...prev, [sessionId]: Array.isArray(data) ? data : [] }));
    } catch {
      toast({ title: "تعذر تحميل الجمل", variant: "destructive" });
    } finally {
      setLoadingSentences(null);
    }
  };

  const openEdit = (session: SessionRow) => {
    setEditSession(session);
    setEditName(session.name);
  };

  const saveEdit = async () => {
    if (!editSession || !editName.trim()) return;
    setEditSaving(true);
    try {
    const res = await fetch(`/api/admin/sessions/${editSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: d.error ?? "فشل الحفظ", variant: "destructive" });
      } else {
        toast({ title: "تم تحديث الاسم" });
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        setEditSession(null);
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteSessionId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sessions/${deleteSessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: d.error ?? "فشل الحذف", variant: "destructive" });
      } else {
        toast({ title: "تم حذف الجلسة" });
        queryClient.invalidateQueries({ queryKey: getAdminListSessionsQueryKey() });
        if (expandedSessionId === deleteSessionId) setExpandedSessionId(null);
        setSentencesMap(prev => { const next = { ...prev }; delete next[deleteSessionId]; return next; });
        setDeleteSessionId(null);
      }
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setDeleting(false);
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
          onClick={() => { resetUploadDialog(); setUploadDialogOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors shadow-sm"
        >
          <Upload className="h-4 w-4" />
          رفع ملف جمل
        </button>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) resetUploadDialog(); }}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع ملف جمل وإنشاء جلسات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">كيف يعمل النظام:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>كل جملة في الملف تُكرَّر 3 مرات</li>
                <li>كل جلسة تحتوي على 50 جملة كحد أقصى</li>
                <li>لا تتكرر نفس الجملة داخل الجلسة الواحدة</li>
                <li>الجلسات تُرقَّم تلقائياً (جلسة 1، جلسة 2، ...)</li>
              </ul>
            </div>
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
                      <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} كيلوبايت</p>
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
                  onClick={() => { setUploadDialogOpen(false); resetUploadDialog(); }}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={!!editSession} onOpenChange={(open) => { if (!open) setEditSession(null); }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              تعديل اسم الجلسة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveEdit()}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
              placeholder="اسم الجلسة"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={editSaving || !editName.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                حفظ
              </button>
              <button
                onClick={() => setEditSession(null)}
                className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSessionId} onOpenChange={(open) => { if (!open) setDeleteSessionId(null); }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              حذف الجلسة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground text-sm leading-relaxed">
              سيتم حذف الجلسة وجميع جملها وتسجيلاتها بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                حذف نهائياً
              </button>
              <button
                onClick={() => setDeleteSessionId(null)}
                className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
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
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-8"></TableHead>
                <TableHead className="text-right">الجلسة</TableHead>
                <TableHead className="text-right">عدد الجمل</TableHead>
                <TableHead className="text-right">المستخدمين</TableHead>
                <TableHead className="text-right">التسجيلات</TableHead>
                <TableHead className="text-right">نسبة الإنجاز</TableHead>
                <TableHead className="text-right w-32">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const pct = session.totalSentences > 0
                  ? Math.round((session.acceptedRecordings / session.totalSentences) * 100)
                  : 0;
                const isExpanded = expandedSessionId === session.id;
                const isLoadingThis = loadingSentences === session.id;
                const sessionSentences = sentencesMap[session.id];

                return (
                  <Fragment key={session.id}>
                    <TableRow className={isExpanded ? "bg-muted/30" : ""}>
                      <TableCell>
                        <button
                          onClick={() => toggleSentences(session.id)}
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                          title="عرض الجمل"
                        >
                          {isLoadingThis
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                      </TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(session as unknown as SessionRow)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="تعديل الاسم"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSessionId(session.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="حذف الجلسة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded sentences row */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-muted/20 border-t border-border px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4 text-primary" />
                                جمل الجلسة ({sessionSentences?.length ?? 0})
                              </h4>
                              <button
                                onClick={() => setExpandedSessionId(null)}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {!sessionSentences ? (
                              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                                <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
                              </div>
                            ) : sessionSentences.length === 0 ? (
                              <p className="text-muted-foreground text-sm py-4">لا توجد جمل في هذه الجلسة</p>
                            ) : (
                              <div className="max-h-64 overflow-y-auto space-y-1.5 pl-1">
                                {sessionSentences.map((s, idx) => (
                                  <div key={s.id} className="flex items-start gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
                                    <span className="text-muted-foreground font-mono text-xs pt-0.5 min-w-[2rem]">{idx + 1}.</span>
                                    <span className="text-foreground leading-relaxed">{s.text}</span>
                                    {s.assignedUserId && (
                                      <span className="mr-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                                        مُعيَّنة
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
