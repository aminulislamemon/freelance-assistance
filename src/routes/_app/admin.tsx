import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, Users, MessageSquareHeart, Trash2, BarChart3, Star, RotateCcw, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — Freelance OS" }] }),
  component: AdminPage,
});

type Profile = {
  id: string;
  display_name: string | null;
  profession: string | null;
  created_at: string;
  last_active_at: string | null;
  deleted_at: string | null;
  projects_count: number;
  meetings_count: number;
  leads_count: number;
  ai_uses_count: number;
};

type Feedback = {
  id: string; user_id: string; rating: number; message: string;
  feedback_type: "bug" | "feature" | "general";
  admin_status: "new" | "reviewed" | "planned" | "completed";
  created_at: string;
};

type EventRow = { event_type: string; page: string | null; created_at: string };

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const nav = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/dashboard" });
  }, [loading, isAdmin, nav]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: pf }, { data: fb }, { data: ev }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }),
        supabase.from("user_events").select("event_type, page, created_at").order("created_at", { ascending: false }).limit(1000),
      ]);
      setProfiles((pf as Profile[]) ?? []);
      setFeedback((fb as Feedback[]) ?? []);
      setEvents((ev as EventRow[]) ?? []);
    })();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 3600 * 1000;
    const active7d = profiles.filter((p) => p.last_active_at && now - new Date(p.last_active_at).getTime() < 7 * day).length;
    const new7d = profiles.filter((p) => now - new Date(p.created_at).getTime() < 7 * day && !p.deleted_at).length;
    const deleted = profiles.filter((p) => p.deleted_at).length;
    return { total: profiles.filter((p) => !p.deleted_at).length, active7d, new7d, deleted };
  }, [profiles]);

  const pageUsage = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) {
      if (e.event_type !== "page_view") continue;
      const k = e.page ?? "unknown";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;

  const updateFeedbackStatus = async (id: string, s: Feedback["admin_status"]) => {
    await supabase.from("feedback").update({ admin_status: s }).eq("id", id);
    setFeedback((arr) => arr.map((f) => (f.id === id ? { ...f, admin_status: s } : f)));
  };

  const restoreUser = async (id: string) => {
    await supabase.from("profiles").update({ deleted_at: null }).eq("id", id);
    setProfiles((arr) => arr.map((p) => (p.id === id ? { ...p, deleted_at: null } : p)));
    toast.success("Account restored");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="relative rounded-3xl glass-strong p-7 ring-gradient aurora-bg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
          <Shield className="size-3 text-primary" /> Admin only
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Users, feedback and product intelligence.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total users" value={stats.total} icon={Users} />
        <KpiCard label="Active (7d)" value={stats.active7d} icon={BarChart3} />
        <KpiCard label="New (7d)" value={stats.new7d} icon={Star} />
        <KpiCard label="Deleted" value={stats.deleted} icon={Trash2} />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="size-4" /> Users</TabsTrigger>
          <TabsTrigger value="feedback"><MessageSquareHeart className="size-4" /> Feedback</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="size-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="deleted"><AlertTriangle className="size-4" /> Deleted</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="glass border-0 p-0 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Profession</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2">Last active</div>
              <div className="col-span-2 text-right">Activity</div>
            </div>
            {profiles.filter((p) => !p.deleted_at).map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/20 text-sm hover:bg-secondary/30">
                <div className="col-span-4 truncate">
                  <div className="font-medium truncate">{p.display_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.id.slice(0, 8)}…</div>
                </div>
                <div className="col-span-2 text-muted-foreground truncate">{p.profession ?? "—"}</div>
                <div className="col-span-2 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                <div className="col-span-2 text-muted-foreground">{p.last_active_at ? new Date(p.last_active_at).toLocaleDateString() : "—"}</div>
                <div className="col-span-2 text-right text-xs text-muted-foreground">
                  <span title="Projects">📁{p.projects_count}</span> <span title="Meetings">📅{p.meetings_count}</span> <span title="Leads">💬{p.leads_count}</span> <span title="AI">🤖{p.ai_uses_count}</span>
                </div>
              </div>
            ))}
            {profiles.filter((p) => !p.deleted_at).length === 0 && (
              <div className="p-10 text-center text-muted-foreground text-sm">No users yet.</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 space-y-3">
          {feedback.length === 0 ? (
            <Card className="glass border-0 p-10 text-center text-muted-foreground">No feedback yet.</Card>
          ) : feedback.map((f) => (
            <Card key={f.id} className="glass border-0 p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cn("size-4", n <= f.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                      ))}
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase">{f.feedback_type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{f.message}</p>
                </div>
                <Select value={f.admin_status} onValueChange={(v) => updateFeedbackStatus(f.id, v as Feedback["admin_status"])}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card className="glass border-0 p-6">
            <h3 className="font-semibold mb-4">Page usage (last {events.length} events)</h3>
            {pageUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {pageUsage.map(([page, count]) => {
                  const max = pageUsage[0][1];
                  const pct = (count / max) * 100;
                  return (
                    <div key={page} className="flex items-center gap-3">
                      <div className="w-32 text-sm capitalize">{page}</div>
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full [background:var(--gradient-primary)]" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-12 text-right text-xs text-muted-foreground">{count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="deleted" className="mt-4 space-y-3">
          {profiles.filter((p) => p.deleted_at).length === 0 ? (
            <Card className="glass border-0 p-10 text-center text-muted-foreground">No deleted accounts.</Card>
          ) : profiles.filter((p) => p.deleted_at).map((p) => (
            <Card key={p.id} className="glass border-0 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.display_name ?? p.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">Deleted {new Date(p.deleted_at!).toLocaleString()}</div>
              </div>
              <Button variant="hero" size="sm" onClick={() => restoreUser(p.id)}>
                <RotateCcw className="size-4" /> Restore
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card className="glass border-0 p-5 hover-lift">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <div className="size-9 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
          <Icon className="size-4 text-primary-foreground" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">{value}</div>
    </Card>
  );
}