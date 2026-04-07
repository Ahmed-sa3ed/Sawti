import { useGetUserSessions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, CheckCircle } from "lucide-react";

export default function UserDashboard() {
  const { data: sessions, isLoading } = useGetUserSessions();

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full" dir="rtl">
      <h1 className="text-3xl font-bold text-primary">جلسات التسجيل</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions?.map((session) => {
          const progress = session.totalSentences > 0 
            ? (session.recordedCount / session.totalSentences) * 100 
            : 0;
            
          const isComplete = session.recordedCount >= session.totalSentences && session.totalSentences > 0;

          return (
            <Card key={session.id} className={isComplete ? "border-green-200 bg-green-50/30" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{session.name}</CardTitle>
                  {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
                {session.description && <CardDescription>{session.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم</span>
                    <span>{session.recordedCount} من {session.totalSentences} جملة</span>
                  </div>
                  <Progress value={progress} className={isComplete ? "bg-green-100 [&>div]:bg-green-500" : ""} />
                </div>
                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>مقبولة: <strong className="text-green-600">{session.acceptedCount}</strong></span>
                  <span>بانتظار المراجعة: <strong>{session.recordedCount - session.acceptedCount}</strong></span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/user/session/${session.id}`} className="w-full">
                  <Button className="w-full gap-2" variant={isComplete ? "outline" : "default"}>
                    <Mic className="h-4 w-4" /> {isComplete ? "مراجعة الجلسة" : "بدء التسجيل"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
        {sessions?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-accent/30 rounded-lg">
            لا يوجد جلسات معينة لك حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
