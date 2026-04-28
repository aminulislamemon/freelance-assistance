import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/revenue")({
  head: () => ({ meta: [{ title: "Revenue — Freelance OS" }] }),
  component: RevenuePage,
});

type Project = { id: string; title: string; client_name: string | null; price: number; status: string; completed_at: string | null; created_at: string };

function RevenuePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => { supabase.from("projects").select("*").then(({ data }) => setProjects((data as Project[]) ?? [])); }, []);

  const months: { key: string; label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString([], { month: "short" }), total: 0 });
  }
  projects.filter(p => p.status === "completed" && p.completed_at).forEach(p => {
    const d = new Date(p.completed_at!);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find(x => x.key === key);
    if (m) m.total += Number(p.price);
  });

  const thisMonth = months[months.length - 1].total;
  const lastMonth = months[months.length - 2].total;
  const growth = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : (thisMonth ? 100 : 0);
  const allTime = projects.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.price), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground mt-1">Earnings, growth, and per-project income.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass border-0 p-5 animate-rise">
          <div className="text-sm text-muted-foreground">This month</div>
          <div className="mt-2 text-3xl font-bold">${thisMonth.toLocaleString()}</div>
          <div className={`mt-2 inline-flex items-center gap-1 text-xs ${growth >= 0 ? "text-[--accent-emerald]" : "text-destructive"}`}>
            {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {growth.toFixed(1)}% vs last month
          </div>
        </Card>
        <Card className="glass border-0 p-5 animate-rise" style={{ animationDelay: "60ms" }}>
          <div className="text-sm text-muted-foreground">Last month</div>
          <div className="mt-2 text-3xl font-bold">${lastMonth.toLocaleString()}</div>
        </Card>
        <Card className="glass border-0 p-5 animate-rise" style={{ animationDelay: "120ms" }}>
          <div className="text-sm text-muted-foreground">All time</div>
          <div className="mt-2 text-3xl font-bold">${allTime.toLocaleString()}</div>
        </Card>
      </div>

      <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "180ms" }}>
        <h2 className="font-semibold mb-4">Last 6 months</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="label" stroke="currentColor" opacity={0.5} fontSize={12} />
              <YAxis stroke="currentColor" opacity={0.5} fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="total" fill="url(#g)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.2 285)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.22 275)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "240ms" }}>
        <h2 className="font-semibold mb-4">By project</h2>
        <div className="space-y-2">
          {projects.filter(p => p.status === "completed").length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No completed projects yet.</p>
          ) : projects.filter(p => p.status === "completed").map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.client_name ?? "No client"}</div>
              </div>
              <div className="inline-flex items-center font-semibold"><DollarSign className="size-4 text-muted-foreground" />{Number(p.price).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}