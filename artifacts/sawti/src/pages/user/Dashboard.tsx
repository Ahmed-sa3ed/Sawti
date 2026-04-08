import { useEffect } from "react";
import { useGetUserSessions } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { CheckCircle, Mic, Coffee, ArrowLeft } from "lucide-react";

export default function UserDashboard() {
  const { data: sessions, isLoading } = useGetUserSessions();
  const [, setLocation] = useLocation();

  const isResting = new URLSearchParams(window.location.search).get("rest") === "1";
  const nextSession = sessions?.find(s => s.totalSentences > 0 && s.recordedCount < s.totalSentences);

  useEffect(() => {
    if (isResting) return;
    if (!sessions || sessions.length === 0) return;
    if (nextSession) setLocation(`/user/session/${nextSession.id}`);
  }, [sessions, isResting, nextSession]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-3 text-slate-400">
          <Mic className="h-5 w-5 animate-pulse text-teal-400" />
          <span>جاري تحميل جلسة التسجيل...</span>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 max-w-lg w-full text-center">
          <Mic className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">لا يوجد جلسات معينة لك حالياً.</p>
          <p className="text-slate-600 text-sm mt-2">تواصل مع المشرف لتعيين جلسة تسجيل.</p>
        </div>
      </div>
    );
  }

  const allDone = sessions.every(s => s.totalSentences === 0 || s.recordedCount >= s.totalSentences);

  if (allDone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8" dir="rtl">
        <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-12 max-w-2xl w-full text-center shadow-[0_0_40px_rgba(20,184,166,0.1)] space-y-6">
          <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-50">أحسنت! لقد أكملت جميع الجلسات</h2>
          <p className="text-slate-400 text-lg">تم تسجيل جميع الجمل المطلوبة. شكراً لمساهمتك!</p>
          <div className="space-y-3 mt-4 text-right">
            {sessions.filter(s => s.totalSentences > 0).map((session) => {
              const progress = (session.recordedCount / session.totalSentences) * 100;
              return (
                <div key={session.id} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-teal-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-200">{session.name}</span>
                      <span className="text-slate-500">{session.recordedCount}/{session.totalSentences}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
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
      <div className="flex-1 flex flex-col items-center justify-center p-8" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 max-w-2xl w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
            <Coffee className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-50">وقت الاستراحة</h2>
          <p className="text-slate-400 text-lg">خذ قسطاً من الراحة، ثم واصل التسجيل عندما تكون مستعداً.</p>
          <div className="space-y-3 mt-4 text-right">
            {sessions.filter(s => s.totalSentences > 0).map((session) => {
              const progress = (session.recordedCount / session.totalSentences) * 100;
              const done = session.recordedCount >= session.totalSentences;
              return (
                <div key={session.id} className="flex items-center gap-3">
                  {done
                    ? <CheckCircle className="h-4 w-4 text-teal-400 shrink-0" />
                    : <Mic className="h-4 w-4 text-slate-500 shrink-0" />
                  }
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-200">{session.name}</span>
                      <span className="text-slate-500">{session.recordedCount}/{session.totalSentences}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${done ? "bg-teal-500" : "bg-teal-600"}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {nextSession && (
            <button
              className="flex items-center gap-2 justify-center mt-4 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] mx-auto"
              onClick={() => setLocation(`/user/session/${nextSession.id}`)}
            >
              <Mic className="h-4 w-4" /> متابعة التسجيل
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center" dir="rtl">
      <div className="flex items-center gap-3 text-slate-400">
        <Mic className="h-5 w-5 animate-pulse text-teal-400" />
        <span>جاري تحميل جلسة التسجيل...</span>
      </div>
    </div>
  );
}
