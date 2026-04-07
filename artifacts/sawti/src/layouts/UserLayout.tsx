import { Link, useLocation, Redirect } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MessageSquare, LogOut } from "lucide-react";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const [location] = useLocation();

  if (isLoading) return null;
  if (!user || user.role !== "user") return <Redirect to="/" />;

  const nav = [
    { href: "/user", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/user/suggest", label: "اقتراح جمل", icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-full bg-background flex-row-reverse">
      <aside className="w-64 border-l border-border bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">صوتي</h1>
          <p className="text-sm text-muted-foreground mt-2">مرحباً {user.username}</p>
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
      <main className="flex-1 overflow-auto p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
