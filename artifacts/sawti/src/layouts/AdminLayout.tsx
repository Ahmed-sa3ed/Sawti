import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FolderOpen, Mic, MessageSquare, Download, LogOut } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [location] = useLocation();

  if (user?.role !== "admin") return null;

  const nav = [
    { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
    { href: "/admin/sessions", label: "الجلسات", icon: FolderOpen },
    { href: "/admin/recordings", label: "التسجيلات", icon: Mic },
    { href: "/admin/suggestions", label: "الاقتراحات", icon: MessageSquare },
    { href: "/admin/download", label: "تحميل البيانات", icon: Download },
  ];

  return (
    <div className="flex h-screen w-full bg-background flex-row-reverse">
      <aside className="w-64 border-l border-border bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">صوتي - الإدارة</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center flex-row-reverse gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${location === item.href ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"}`}>
                <item.icon className="h-5 w-5 ml-2" />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full flex justify-end gap-2" onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.href = "/" })}>
            <LogOut className="h-4 w-4 ml-2" /> تسجيل الخروج
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
