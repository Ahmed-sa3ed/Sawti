import { useEffect } from "react";
import { useGetUserSessions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mic, Coffee } from "lucide-react";

export default function UserDashboard() {
  const { data: sessions, isLoading } = useGetUserSessions();
  const [, setLocation] = useLocation();

  const isResting = new URLSearchParams(window.location.search).get("rest") === "1";

  const nextSession = sessions?.find(s => s.totalSentences > 0 && s.recordedCount < s.totalSentences);

  useEffect(() => {
    if (isResting) return;
    if (!sessions || sessions.length === 0) return;
    if (nextSession) {
      setLocation(`/user/session/${nextSession.id}`);
    }
  }, [sessions, isResting, nextSession]);

  if (isLoading) return <div>جاري التحميل...</div>;

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center" dir="rtl">
        <div className="py-12 text-muted-foreground bg-accent/30 rounded-lg px-8">
          لا يوجد جلسات معينة لك حالياً.
        </div>
      </div>
    );
  }

  const allDone = sessions.every(s => s.totalSentences === 0 || s.recordedCount >= s.totalSentences);

  if (allDone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center" dir="rtl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-12 space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-3xl font-bold text-green-800">أحسنت! لقد أكملت جميع الجلسات</h2>
          <p className="text-lg text-green-700">تم تسجيل جميع الجمل المطلوبة. شكراً لمساهمتك!</p>
          <div className="space-y-3 mt-4 text-right">
            {sessions.filter(s => s.totalSentences > 0).map((session) => {
              const progress = (session.recordedCount / session.totalSentences) * 100;
              return (
                <div key={session.id} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{session.name}</span>
                      <span className="text-muted-foreground">{session.recordedCount}/{session.totalSentences}</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (isResting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center" dir="rtl">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-12 space-y-6">
          <Coffee className="h-16 w-16 text-blue-400 mx-auto" />
          <h2 className="text-3xl font-bold text-blue-800">وقت الاستراحة</h2>
          <p className="text-lg text-blue-700">خذ قسطاً من الراحة، ثم واصل التسجيل عندما تكون مستعداً.</p>
          <div className="space-y-3 mt-4 text-right">
            {sessions.filter(s => s.totalSentences > 0).map((session) => {
              const progress = (session.recordedCount / session.totalSentences) * 100;
              const done = session.recordedCount >= session.totalSentences;
              return (
                <div key={session.id} className="flex items-center gap-3">
                  {done
                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    : <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{session.name}</span>
                      <span className="text-muted-foreground">{session.recordedCount}/{session.totalSentences}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
          {nextSession && (
            <Button size="lg" className="mt-4" onClick={() => setLocation(`/user/session/${nextSession.id}`)}>
              <Mic className="h-4 w-4 ml-2" /> متابعة التسجيل
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center" dir="rtl">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Mic className="h-5 w-5 animate-pulse" />
        <span>جاري تحميل جلسة التسجيل...</span>
      </div>
    </div>
  );
}
