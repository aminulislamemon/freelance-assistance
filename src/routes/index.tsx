import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Bell, BarChart3, CheckCircle2, ArrowRight, Mic, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [loading, user, nav]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="absolute inset-0 -z-10 [background-image:var(--gradient-hero)] opacity-90" />
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Freelance OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button variant="hero">Get started</Button></Link>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-16 pb-24 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-muted-foreground animate-fade-in">
          <span className="size-1.5 rounded-full bg-[--accent-emerald]" /> Your personal assistant for freelance work
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight animate-rise">
          Run your freelance business <span className="gradient-text">like a studio.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-rise" style={{ animationDelay: "100ms" }}>
          Projects, deadlines, meetings, revenue, and an AI coach — in one beautiful workspace with voice alerts that remind you exactly when it matters.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 animate-rise" style={{ animationDelay: "200ms" }}>
          <Link to="/auth">
            <Button size="lg" variant="hero" className="group">
              Start free <ArrowRight className="ml-1 size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-4 text-left">
          {[
            { icon: CheckCircle2, title: "Projects & tasks", desc: "Track every project, client and deliverable with visual progress." },
            { icon: Bell, title: "Voice deadline alerts", desc: "Hear reminders 24h, 12h and 3h before — never miss a deadline again." },
            { icon: CalendarClock, title: "Meeting reminders", desc: "Voice nudges before each call. \"Meeting with Acme in 5 minutes.\"" },
            { icon: BarChart3, title: "Revenue dashboard", desc: "Monthly earnings, growth vs last month, project income." },
            { icon: Sparkles, title: "AI assistant", desc: "Get personalized productivity tips and revenue insights on demand." },
            { icon: Mic, title: "Three sound modes", desc: "Distinct alert sounds for meetings, deadlines and pending tasks." },
          ].map((f, i) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover-lift animate-rise" style={{ animationDelay: `${300 + i * 60}ms` }}>
              <div className="size-10 rounded-xl [background:var(--gradient-primary)] grid place-items-center mb-4">
                <f.icon className="size-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}