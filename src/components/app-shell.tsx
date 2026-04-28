import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderKanban, CalendarDays, BarChart3, Bot, Settings,
  Sparkles, LogOut, Sun, Moon, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useNotifier } from "@/hooks/use-notifier";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/meetings", label: "Meetings", icon: CalendarDays },
  { to: "/revenue", label: "Revenue", icon: BarChart3 },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  useNotifier();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
          collapsed ? "w-[76px]" : "w-[244px]",
        )}
      >
        <div className="px-4 py-5 flex items-center gap-2">
          <div className="size-9 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)] shrink-0">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-semibold tracking-tight">Freelance OS</span>}
        </div>
        <nav className="px-3 mt-2 space-y-1 flex-1">
          {items.map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <it.icon className="size-4 shrink-0" />
                {!collapsed && <span>{it.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-left px-2 py-1"
          >
            {collapsed ? "→" : "← Collapse"}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 md:hidden">
            <div className="size-8 rounded-lg [background:var(--gradient-primary)] grid place-items-center">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Freelance OS</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" title="Notifications enabled">
              <Bell className="size-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-border">
              <div className="size-8 rounded-full [background:var(--gradient-primary)] grid place-items-center text-primary-foreground text-sm font-semibold">
                {user.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground max-w-[160px] truncate">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out">
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass rounded-2xl px-2 py-2 flex justify-around">
          {items.slice(0, 5).map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link key={it.to} to={it.to} className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px]",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                <it.icon className="size-4" />
                {it.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}