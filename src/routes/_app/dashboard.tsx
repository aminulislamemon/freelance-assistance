import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, CheckCircle2, Clock, Wallet, FolderKanban, CalendarClock,
  BellRing, Sparkles, TrendingUp, Lightbulb, Zap, Target, Coffee, Trophy,
  AlarmClock, Users, Newspaper, ExternalLink, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockAudio, requestNotifyPermission, playSound, speak } from "@/lib/notifications";
import { toast } from "sonner";
import { getTechBlogs, type BlogPost } from "@/server/tech-blogs.functions";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Freelance OS" }] }),
  component: Dashboard,
});

type Project = { id: string; title: string; client_name: string | null; price: number; deadline: string | null; status: string; completed_at: string | null };
type Meeting = { id: string; title: string; client_name: string | null; starts_at: string };

const TIPS = [
  { icon: Zap, title: "Two-hour deep focus", body: "Block your calendar each morning for one uninterrupted, high-leverage task." },
  { icon: Target, title: "Charge for outcomes", body: "Quote per deliverable, not per hour — your best clients prefer it." },
  { icon: Coffee, title: "Buffer every estimate", body: "Add 25% to project timelines. Ship early — clients love it." },
  { icon: Trophy, title: "Raise rates yearly", body: "Bump 10–15% with new clients. Inflation alone justifies it." },
  { icon: Lightbulb, title: "Write it down", body: "Send a recap email after every call. It prevents 90% of scope creep." },
];

function greet(name: string) {
  const h = new Date().getHours();
  const part = h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Late night, hero";
  return `${part}, ${name}`;
}

function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tipIdx, setTipIdx] = useState(0);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [profession, setProfession] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: ms }, { data: prof }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("meetings").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
        user ? supabase.from("profiles").select("display_name, profession, interests").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
      ]);
      setProjects((ps as Project[]) ?? []);
      setMeetings((ms as Meeting[]) ?? []);
      const name = (prof?.display_name as string | undefined) || user?.email?.split("@")[0] || "there";
      // first name only
      setDisplayName(name.split(/[\s.]+/)[0]);
      setProfession((prof?.profession as string | null) ?? null);
      setInterests(((prof?.interests as string[] | null) ?? []));
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (loading) return; // wait for profile load to know interests
    setBlogsLoading(true);
    getTechBlogs({ data: { interests, profession: profession ?? undefined } })
      .then((r) => setBlogs(r.posts ?? []))
      .catch(() => setBlogs([]))
      .finally(() => setBlogsLoading(false));
  }, [loading, profession, interests]);

  const now = new Date();
  const stats = useMemo(() => {
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = (thisMonth + 11) % 12;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const sum = (arr: Project[]) => arr.reduce((s, p) => s + Number(p.price), 0);
    const inMonth = (p: Project, m: number, y: number) => {
      const d = p.completed_at ? new Date(p.completed_at) : p.deadline ? new Date(p.deadline) : null;
      return !!d && d.getMonth() === m && d.getFullYear() === y;
    };
    const completedThisMonth = projects.filter((p) => p.status === "completed" && inMonth(p, thisMonth, thisYear));
    const completedLastMonth = projects.filter((p) => p.status === "completed" && inMonth(p, lastMonth, lastMonthYear));
    return {
      monthRevenue: sum(completedThisMonth),
      lastMonthRevenue: sum(completedLastMonth),
      active: projects.filter((p) => p.status !== "completed" && p.status !== "cancelled").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const upcoming = projects
    .filter((p) => p.status !== "completed" && p.status !== "cancelled" && p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const growth = stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : stats.monthRevenue > 0 ? 100 : 0;

  const enableAlerts = async () => {
    unlockAudio();
    const perm = await requestNotifyPermission();
    playSound("task");
    speak(`Hey ${displayName}, alerts are armed. I'll keep an eye on your deadlines.`);
    if (perm === "granted") toast.success("Alerts enabled", { description: "You'll hear sounds + get desktop pings." });
    else toast.info("In-app alerts on", { description: "Allow notifications to also get desktop pings." });
  };

  const statCards = [
    { label: "This month", value: `$${stats.monthRevenue.toLocaleString()}`, sub: growth >= 0 ? `▲ ${growth}% vs last month` : `▼ ${Math.abs(growth)}% vs last month`, subGood: growth >= 0, icon: Wallet, accent: "from-[--primary] to-[--primary-glow]" },
    { label: "Active projects", value: String(stats.active), sub: `${upcoming.length} with deadline`, subGood: true, icon: FolderKanban, accent: "from-[--accent-emerald] to-[--primary]" },
    { label: "Completed", value: String(stats.completed), sub: "All time", subGood: true, icon: CheckCircle2, accent: "from-[--primary] to-[--accent-emerald]" },
    { label: "Meetings ahead", value: String(meetings.length), sub: meetings[0] ? `Next: ${new Date(meetings[0].starts_at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "None scheduled", subGood: true, icon: CalendarClock, accent: "from-[--primary-glow] to-[--accent-emerald]" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl glass-strong p-7 md:p-9 ring-gradient aurora-bg">
        <div className="relative flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-primary" /> {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              {greet(displayName || "there")} <span className="inline-block animate-float">✨</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Your studio at a glance — deadlines, meetings and revenue all in one calm view. Let's make today count.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="glass" onClick={enableAlerts} className="relative">
              <BellRing className="size-4" /> Enable alerts
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[--accent-emerald] animate-pulse-ring" />
            </Button>
            <Link to="/projects"><Button variant="hero"><Sparkles className="size-4" /> New project</Button></Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <Card key={s.label} className="glass border-0 p-5 hover-lift animate-rise overflow-hidden relative group" style={{ animationDelay: `${i * 70}ms` }}>
            <div className={cn("absolute -top-10 -right-10 size-36 rounded-full opacity-25 blur-2xl bg-gradient-to-br transition-transform duration-500 group-hover:scale-125", s.accent)} />
            <div className="flex items-center justify-between relative">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
              <div className={cn("size-9 rounded-xl grid place-items-center bg-gradient-to-br", s.accent, "shadow-[var(--shadow-glow)]")}>
                <s.icon className="size-4 text-primary-foreground" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight relative">{s.value}</div>
            <div className={cn("mt-1.5 text-xs flex items-center gap-1 relative", s.subGood ? "text-[--accent-emerald]" : "text-destructive")}>
              {s.label === "This month" && <TrendingUp className="size-3" />}
              {s.sub}
            </div>
          </Card>
        ))}
      </div>

      {/* Deadlines + Meetings */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-0 p-6 lg:col-span-2 animate-rise">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2"><AlarmClock className="size-4 text-primary" /> Upcoming deadlines</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Sorted by urgency — closest first</p>
            </div>
            <Link to="/projects" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {loading ? <SkeletonRows /> : upcoming.length === 0 ? (
            <Empty text="No upcoming deadlines. You're clear ✨" />
          ) : (
            <div className="space-y-2">
              {upcoming.map((p, i) => <DeadlineRow key={p.id} p={p} delay={i * 60} />)}
            </div>
          )}
        </Card>

        <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2"><Users className="size-4 text-[--accent-emerald]" /> Next meetings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Voice-armed reminders</p>
            </div>
            <Link to="/meetings" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              All <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {loading ? <SkeletonRows /> : meetings.length === 0 ? <Empty text="Calendar is clear." /> : (
            <div className="space-y-3">
              {meetings.map((m, i) => {
                const d = new Date(m.starts_at);
                const inMin = Math.round((d.getTime() - Date.now()) / 60000);
                const label = inMin < 60 ? `in ${inMin} min` : inMin < 1440 ? `in ${Math.round(inMin / 60)}h` : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div key={m.id} className="rounded-xl bg-secondary/50 p-3 hover:bg-secondary transition-all hover:translate-x-1 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider rounded-full bg-[--primary]/15 text-[--primary] px-2 py-0.5">{label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {m.client_name ? `${m.client_name} • ` : ""}{d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Productivity Tips */}
      <Card className="glass border-0 p-6 animate-rise overflow-hidden relative" style={{ animationDelay: "200ms" }}>
        <div className="absolute -top-12 -left-12 size-48 rounded-full opacity-30 blur-3xl [background:var(--gradient-emerald)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="size-12 rounded-2xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)] shrink-0">
              {(() => { const T = TIPS[tipIdx].icon; return <T className="size-5 text-primary-foreground" />; })()}
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Daily tip</div>
              <h3 className="font-semibold text-lg mt-0.5">{TIPS[tipIdx].title}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{TIPS[tipIdx].body}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="glass" size="sm" onClick={() => setTipIdx((i) => (i + 1) % TIPS.length)}>Next tip</Button>
            <Link to="/assistant"><Button variant="hero" size="sm"><Sparkles className="size-4" /> Ask AI</Button></Link>
          </div>
        </div>
        <div className="mt-5 flex gap-1.5 relative">
          {TIPS.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full transition-all", i === tipIdx ? "bg-primary" : "bg-secondary")} />
          ))}
        </div>
      </Card>

      {/* Tech Blogs */}
      <Card className="glass border-0 p-6 animate-rise aurora-bg" style={{ animationDelay: "260ms" }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
              <Newspaper className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Fresh tech & conversion blogs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Curated daily — analytics, growth, AI, web dev</p>
            </div>
          </div>
          <Button variant="glass" size="sm" onClick={() => {
            setBlogsLoading(true);
            getTechBlogs({ data: { interests, profession: profession ?? undefined } })
              .then((r) => setBlogs(r.posts ?? []))
              .catch(() => setBlogs([]))
              .finally(() => setBlogsLoading(false));
          }}>
            <Sparkles className="size-3.5" /> Refresh
          </Button>
        </div>
        {blogsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2,3,4,5].map(i => <div key={i} className="h-44 rounded-2xl bg-secondary/40 animate-pulse" />)}
          </div>
        ) : blogs.length === 0 ? (
          <Empty text="Couldn't fetch blogs right now. Try refresh." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.slice(0, 6).map((b, i) => <BlogCard key={b.id} b={b} i={i} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function BlogCard({ b, i }: { b: BlogPost; i: number }) {
  return (
    <a
      href={b.url}
      target="_blank"
      rel="noreferrer"
      className="group rounded-2xl bg-secondary/40 hover:bg-secondary transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] overflow-hidden flex flex-col animate-rise"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[--primary]/20 to-[--accent-emerald]/20">
        {b.cover ? (
          <img src={b.cover} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <Newspaper className="size-10 text-primary opacity-50" />
          </div>
        )}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
          {b.source}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {b.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{b.description}</p>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {b.tags.slice(0, 2).map((t) => (
              <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-[--primary]/10 text-[--primary] px-1.5 py-0.5 text-[10px]">
                <Tag className="size-2.5" />{t}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 shrink-0">
            {b.readingMinutes}m <ExternalLink className="size-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

function DeadlineRow({ p, delay }: { p: Project; delay: number }) {
  const ms = p.deadline ? new Date(p.deadline).getTime() - Date.now() : 0;
  const hours = Math.max(0, Math.round(ms / 3600000));
  const urgent = hours <= 24;
  const critical = hours <= 6;
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: p.id }}
      className="flex items-center justify-between rounded-xl bg-secondary/50 p-4 hover:bg-secondary transition-all hover:translate-x-1 animate-rise group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("size-10 rounded-xl grid place-items-center text-sm font-bold shrink-0",
          critical ? "bg-destructive/15 text-destructive" : urgent ? "bg-amber-500/15 text-amber-500" : "bg-[--accent-emerald]/15 text-[--accent-emerald]")}>
          {hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate group-hover:text-primary transition-colors">{p.title}</div>
          <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
            <span>{p.client_name ?? "No client"}</span>
            <span>•</span>
            <span>${Number(p.price).toLocaleString()}</span>
            <span>•</span>
            <span className="capitalize">{p.status.replace("_", " ")}</span>
          </div>
        </div>
      </div>
      <div className={cn("ml-3 shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        critical ? "bg-destructive/15 text-destructive" : urgent ? "bg-amber-500/15 text-amber-500" : "bg-[--accent-emerald]/15 text-[--accent-emerald]")}>
        <Clock className="size-3" />
        {p.deadline ? new Date(p.deadline).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
      </div>
    </Link>
  );
}

const SkeletonRows = () => (
  <div className="space-y-2">
    {[0,1,2].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />)}
  </div>
);
const Empty = ({ text }: { text: string }) => <div className="text-sm text-muted-foreground py-8 text-center">{text}</div>;
