import { useAdminGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, Mic, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetDashboard();

  if (isLoading) return <div>جاري التحميل...</div>;
  if (!stats) return null;

  const acceptanceRate = stats.totalRecordings > 0 
    ? Math.round((stats.acceptedRecordings / stats.totalRecordings) * 100) 
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold text-primary">لوحة القيادة</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الجلسات</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الجمل</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSentences}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecordings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مقبولة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.acceptedRecordings}</div>
            <p className="text-xs text-muted-foreground mt-1">معدل القبول: {acceptanceRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مرفوضة</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedRecordings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بانتظار المراجعة</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingRecordings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اقتراحات معلقة</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSuggestions}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
