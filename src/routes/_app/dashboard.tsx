import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, Clock, DollarSign, FolderKanban, CalendarClock, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound, speak } from "@/lib/notifications";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Freelance OS" }] }),
  component: Dashboard,
});

type Project = { id: string; title: string; client_name: string | null; price: number; deadline: string | null; status: string };
type Meeting = { id: string; title: string; client_name: string | null; starts_at: string };

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: ms }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("meetings").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
      ]);
      setProjects((ps as Project[]) ?? []);
      setMeetings((ms as Meeting[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const completedThisMonth = projects.filter(
    (p) => p.status === "completed" && p.deadline && new Date(p.deadline).getMonth() === thisMonth && new Date(p.deadline).getFullYear() === thisYear,
  );
  const monthRevenue = completedThisMonth.reduce((s, p) => s + Number(p.price), 0);
  const active = projects.filter((p) => p.status !== "completed");
  const upcoming = active
    .filter((p) => p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  const stats = [
    { label: "This month", value: `$${monthRevenue.toLocaleString()}`, icon: DollarSign, accent: "from-[--primary] to-[--primary-glow]" },
    { label: "Active projects", value: String(active.length), icon: FolderKanban, accent: "from-[--accent-emerald] to-[--primary]" },
    { label: "Completed", value: String(projects.filter((p) => p.status === "completed").length), icon: CheckCircle2, accent: "from-[--primary] to-[--accent-emerald]" },
    { label: "Upcoming meetings", value: String(meetings.length), icon: CalendarClock, accent: "from-[--primary-glow] to-[--accent-emerald]" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your studio today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" onClick={() => { playSound("task"); speak("Notifications are working perfectly."); }}>
            <Mic className="size-4" /> Test voice
          </Button>
          <Link to="/projects"><Button variant="hero">New project</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className="glass border-0 p-5 hover-lift animate-rise overflow-hidden relative" style={{ animationDelay: `${i * 70}ms` }}>
            <div className={cn("absolute -top-8 -right-8 size-32 rounded-full opacity-25 blur-2xl bg-gradient-to-br", s.accent)} />
            <div className="flex items-center justify-between relative">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight relative">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-0 p-6 lg:col-span-2 animate-rise">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Upcoming deadlines</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {loading ? (
            <Skeleton />
          ) : upcoming.length === 0 ? (
            <Empty text="No upcoming deadlines. You're clear ✨" />
          ) : (
            <div className="space-y-2">
              {upcoming.map((p, i) => (
                <DeadlineRow key={p.id} p={p} delay={i * 60} />
              ))}
            </div>
          )}
        </Card>

        <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Next meetings</h2>
            <Link to="/meetings" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              All <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {loading ? <Skeleton /> : meetings.length === 0 ? <Empty text="No meetings scheduled." /> : (
            <div className="space-y-3">
              {meetings.map((m) => (
                <div key={m.id} className="rounded-xl bg-secondary/50 p-3 hover:bg-secondary transition-colors">
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.client_name ? `${m.client_name} • ` : ""}{new Date(m.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function DeadlineRow({ p, delay }: { p: Project; delay: number }) {
  const ms = p.deadline ? new Date(p.deadline).getTime() - Date.now() : 0;
  const hours = Math.max(0, Math.round(ms / 3600000));
  const urgent = hours <= 24;
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: p.id }}
      className="flex items-center justify-between rounded-xl bg-secondary/50 p-4 hover:bg-secondary transition-all hover:translate-x-1 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="min-w-0">
        <div className="font-medium truncate">{p.title}</div>
        <div className="text-xs text-muted-foreground truncate">{p.client_name ?? "No client"}</div>
      </div>
      <div className={cn(
        "ml-3 shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        urgent ? "bg-destructive/15 text-destructive" : "bg-[--accent-emerald]/15 text-[--accent-emerald]"
      )}>
        <Clock className="size-3" />
        {hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`}
      </div>
    </Link>
  );
}

const Skeleton = () => (
  <div className="space-y-2">
    {[0,1,2].map((i) => <div key={i} className="h-14 rounded-xl bg-secondary/40 animate-pulse" />)}
  </div>
);
const Empty = ({ text }: { text: string }) => <div className="text-sm text-muted-foreground py-8 text-center">{text}</div>;