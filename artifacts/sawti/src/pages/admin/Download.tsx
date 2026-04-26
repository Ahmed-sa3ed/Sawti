import { useState } from "react";
import { useAdminListUsers, useAdminListSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

export default function AdminDownload() {
  const { data: users } = useAdminListUsers();
  const { data: sessions } = useAdminListSessions();
  
  const [userId, setUserId] = useState<string>("all");
  const [sessionId, setSessionId] = useState<string>("all");

  const handleDownload = () => {
    let url = "/api/admin/download?";
    if (userId !== "all") url += `userId=${userId}&`;
    if (sessionId !== "all") url += `sessionId=${sessionId}&`;
    
    window.location.href = url;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold text-primary">تحميل البيانات</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>تحميل مجموعة البيانات</CardTitle>
          <CardDescription>
            قم بتحميل ملف ZIP يحتوي على ملفات الصوت وملف metadata.csv الذي يربط التسجيلات بالنصوص.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>تصفية حسب المستخدم</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر المستخدم" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {users?.filter(u => u.role === "user").map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>تصفية حسب الجلسة</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر الجلسة" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">جميع الجلسات</SelectItem>
                  {sessions?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleDownload} className="w-full gap-2 text-lg py-6">
            <Download className="h-5 w-5" /> تحميل البيانات الآن
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
