import { Link, useLocation, Redirect } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Mic, LayoutDashboard, MessageSquare, LogOut } from "lucide-react";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const [location] = useLocation();

  if (isLoading) return null;
  if (!user || user.role !== "user") return <Redirect to="/" />;

  const nav = [
    { href: "/user", label: "جلسة التسجيل", icon: Mic },
    { href: "/user", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/user/suggest", label: "اقتراح جمل", icon: MessageSquare },
  ];

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 font-sans overflow-hidden" dir="rtl">
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-teal-400 tracking-tight">صوتي</h1>
            <p className="text-slate-400 text-sm mt-1">منصة جمع البيانات الصوتية</p>
          </div>

          <nav className="px-3 py-2 space-y-1">
            {nav.map((item) => {
              const active = location === item.href;
              return (
                <Link key={item.href + item.label} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors font-medium ${
                    active
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : "text-slate-300 hover:text-slate-50 hover:bg-slate-800/50"
                  }`}>
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold border border-teal-500/30 text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-slate-400 truncate">مساهم نشط</p>
            </div>
            <button
              className="text-slate-400 hover:text-red-400 transition-colors p-2"
              onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.href = "/" })}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
}
