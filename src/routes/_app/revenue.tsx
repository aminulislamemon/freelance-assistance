import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Trophy, ArrowUpDown, Crown } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/revenue")({
  head: () => ({ meta: [{ title: "Revenue — Freelance OS" }] }),
  component: RevenuePage,
});

type Project = { id: string; title: string; client_name: string | null; price: number; status: string; completed_at: string | null; created_at: string };

function RevenuePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sort, setSort] = useState<"price" | "recent">("price");
  useEffect(() => { supabase.from("projects").select("*").then(({ data }) => setProjects((data as Project[]) ?? [])); }, []);

  const months = useMemo(() => {
    const arr: { key: string; label: string; total: number; count: number; cumulative: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString([], { month: "short" }),
        total: 0, count: 0, cumulative: 0,
      });
    }
    projects.filter(p => p.status === "completed" && p.completed_at).forEach(p => {
      const d = new Date(p.completed_at!);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = arr.find(x => x.key === key);
      if (m) { m.total += Number(p.price); m.count += 1; }
    });
    let run = 0;
    arr.forEach(m => { run += m.total; m.cumulative = run; });
    return arr;
  }, [projects]);

  const thisMonth = months[months.length - 1].total;
  const lastMonth = months[months.length - 2].total;
  const growth = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : (thisMonth ? 100 : 0);
  const allTime = projects.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.price), 0);
  const avgMonth = months.reduce((s, m) => s + m.total, 0) / months.length;
  const peak = months.reduce((a, b) => (b.total > a.total ? b : a), months[0]);

  const completed = projects.filter(p => p.status === "completed");
  const sorted = [...completed].sort((a, b) =>
    sort === "price"
      ? Number(b.price) - Number(a.price)
      : new Date(b.completed_at ?? b.created_at).getTime() - new Date(a.completed_at ?? a.created_at).getTime()
  );
  const maxPrice = Math.max(1, ...completed.map(p => Number(p.price)));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="relative rounded-3xl glass-strong p-7 ring-gradient aurora-bg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
          <Wallet className="size-3 text-primary" /> Financial overview
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground mt-1">Earnings, growth and per-project income — at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="This month" value={thisMonth} icon={Wallet} accent="from-[--primary] to-[--primary-glow]"
          extra={<span className={cn("inline-flex items-center gap-1 text-xs", growth >= 0 ? "text-[--accent-emerald]" : "text-destructive")}>
            {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {growth.toFixed(1)}% vs last month
          </span>} delay={0} />
        <StatTile label="Last month" value={lastMonth} icon={DollarSign} accent="from-[--accent-emerald] to-[--primary]" delay={60} />
        <StatTile label="6-mo average" value={Math.round(avgMonth)} icon={TrendingUp} accent="from-[--primary-glow] to-[--accent-emerald]" delay={120} />
        <StatTile label="All time" value={allTime} icon={Trophy} accent="from-[--primary] to-[--accent-emerald]"
          extra={peak.total > 0 ? <span className="text-xs text-muted-foreground">Peak: {peak.label} ${peak.total.toLocaleString()}</span> : undefined} delay={180} />
      </div>

      <Card className="glass border-0 p-6 animate-rise aurora-bg" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-lg">Last 6 months</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly earnings with cumulative trajectory</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="var(--primary)" label="Monthly" />
            <LegendDot color="var(--accent-emerald)" label="Cumulative" />
          </div>
        </div>
        <div className="h-80 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.18 290)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="oklch(0.55 0.22 275)" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.18 160)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="oklch(0.78 0.18 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="currentColor" opacity={0.1} vertical={false} />
              <XAxis dataKey="label" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`} />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-soft)" }}
                formatter={(val: number, name: string) => [`$${Number(val).toLocaleString()}`, name === "total" ? "Earned" : name === "cumulative" ? "Cumulative" : name]}
              />
              <Area type="monotone" dataKey="cumulative" stroke="oklch(0.78 0.18 160)" strokeWidth={2.5} fill="url(#areaFill)" />
              <Bar dataKey="total" fill="url(#barFill)" radius={[10, 10, 0, 0]} maxBarSize={48} />
              <Line type="monotone" dataKey="total" stroke="oklch(0.78 0.18 290)" strokeWidth={0} dot={{ r: 4, fill: "oklch(0.78 0.18 290)", stroke: "var(--background)", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-lg">By project</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top earners — share of your total revenue</p>
          </div>
          <Button variant="glass" size="sm" onClick={() => setSort(s => s === "price" ? "recent" : "price")}>
            <ArrowUpDown className="size-3.5" /> {sort === "price" ? "Highest paid" : "Most recent"}
          </Button>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No completed projects yet — finish one to see it here.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, i) => {
              const pct = (Number(p.price) / maxPrice) * 100;
              const share = (Number(p.price) / Math.max(1, allTime)) * 100;
              return (
                <div key={p.id} className="rounded-2xl bg-secondary/40 hover:bg-secondary transition-all p-4 animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("size-9 rounded-xl grid place-items-center text-xs font-bold shrink-0",
                        i === 0 ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-secondary text-muted-foreground")}>
                        {i === 0 ? <Crown className="size-4" /> : `#${i + 1}`}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.client_name ?? "No client"} • {share.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold tabular-nums">${Number(p.price).toLocaleString()}</div>
                      {p.completed_at && (
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(p.completed_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-background/60 overflow-hidden">
                    <div className="h-full rounded-full [background:var(--gradient-primary)] transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent, extra, delay }:
  { label: string; value: number; icon: any; accent: string; extra?: React.ReactNode; delay: number }) {
  return (
    <Card className="glass border-0 p-5 hover-lift animate-rise relative overflow-hidden group" style={{ animationDelay: `${delay}ms` }}>
      <div className={cn("absolute -top-10 -right-10 size-36 rounded-full opacity-25 blur-2xl bg-gradient-to-br transition-transform duration-500 group-hover:scale-125", accent)} />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <div className={cn("size-9 rounded-xl grid place-items-center bg-gradient-to-br shadow-[var(--shadow-glow)]", accent)}>
          <Icon className="size-4 text-primary-foreground" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight tabular-nums relative">${value.toLocaleString()}</div>
      {extra && <div className="mt-1.5 relative">{extra}</div>}
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}