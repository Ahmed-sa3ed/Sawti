import { Link, useLocation, Redirect } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { MessageSquare, LogOut } from "lucide-react";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const [location] = useLocation();

  if (isLoading) return null;
  if (!user || user.role !== "user") return <Redirect to="/" />;

  const initials = user.username.slice(0, 2).toUpperCase();
  const isSuggestPage = location === "/user/suggest";

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-50 font-sans overflow-hidden" dir="rtl">
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <Link href="/user">
          <div className="cursor-pointer">
            <h1 className="text-xl font-bold text-teal-400 tracking-tight">صوتي</h1>
            <p className="text-slate-500 text-xs">منصة جمع البيانات الصوتية</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm">
            <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold border border-teal-500/30 text-xs flex-shrink-0">
              {initials}
            </div>
            <span className="text-slate-300 text-sm">{user.username}</span>
          </div>

          <Link href="/user/suggest">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              isSuggestPage
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                : "text-slate-300 hover:text-slate-50 hover:bg-slate-800"
            }`}>
              <MessageSquare size={16} />
              <span>اقتراح جمل</span>
            </div>
          </Link>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.href = "/" })}
            title="تسجيل الخروج"
          >
            <LogOut size={16} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
}
