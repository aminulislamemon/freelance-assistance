import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, FolderKanban, CalendarDays, BarChart3, Bot, Settings,
  Sparkles, LogOut, Sun, Moon, Bell, Menu, X, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useNotifier } from "@/hooks/use-notifier";
import { unlockAudio, requestNotifyPermission } from "@/lib/notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/meetings", label: "Meetings", icon: CalendarDays },
  { to: "/revenue", label: "Revenue", icon: BarChart3 },
  { to: "/assistant", label: "AI Coach", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  useNotifier();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  // Onboarding gate
  useEffect(() => {
    if (loading || !user) return;
    if (path === "/onboarding") { setCheckingProfile(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.onboarded) {
        nav({ to: "/onboarding" });
      }
      setCheckingProfile(false);
    })();
    return () => { cancelled = true; };
  }, [user, loading, path, nav]);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [path]);

  if (loading || !user || checkingProfile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Onboarding renders standalone (no sidebar / no header)
  if (path === "/onboarding") return <Outlet />;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
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
                title={collapsed ? it.label : undefined}
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

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-sidebar border-r border-sidebar-border p-4 flex flex-col animate-rise">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
                  <Sparkles className="size-5 text-primary-foreground" />
                </div>
                <span className="font-semibold tracking-tight">Freelance OS</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}><X className="size-4" /></Button>
            </div>
            <nav className="space-y-1 flex-1">
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
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-sidebar-border flex items-center gap-2">
              <div className="size-8 rounded-full [background:var(--gradient-primary)] grid place-items-center text-primary-foreground text-sm font-semibold shrink-0">
                {user.email?.[0].toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out"><LogOut className="size-4" /></Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 sm:h-16 border-b border-border flex items-center justify-between px-3 sm:px-6 bg-background/60 backdrop-blur-md sticky top-0 z-30 gap-2">
          <div className="flex items-center gap-2 md:hidden min-w-0">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="shrink-0"><Menu className="size-5" /></Button>
            <div className="size-7 rounded-lg [background:var(--gradient-primary)] grid place-items-center shrink-0">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm truncate">Freelance OS</span>
          </div>
          <div className="hidden md:block flex-1" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Enable alerts"
              onClick={async () => {
                unlockAudio();
                const p = await requestNotifyPermission();
                toast.success(p === "granted" ? "Alerts enabled" : "In-app alerts on");
              }}
            >
              <Bell className="size-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 ml-1 pl-3 border-l border-border">
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
        <nav className="md:hidden fixed bottom-3 left-2 right-2 z-40 glass-strong rounded-2xl px-1 py-1.5 flex justify-around">
          {[items[0], items[1], items[2], items[4], items[5]].map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link key={it.to} to={it.to} className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] transition-all min-w-[52px]",
                active ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]" : "text-muted-foreground"
              )}>
                <it.icon className="size-4" />
                <span className="truncate max-w-[60px]">{it.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
