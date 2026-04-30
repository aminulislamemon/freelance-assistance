import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles, Bell, BarChart3, CheckCircle2, ArrowRight, Mic, CalendarClock,
  Bot, FolderKanban, Star, Quote, Zap, Shield, Headphones, Rocket, Newspaper,
  Calendar, Wallet, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freelance OS — The studio OS for modern freelancers" },
      { name: "description", content: "Run your freelance business like a studio. Projects, deadlines, voice alerts, revenue and an AI coach in one beautiful workspace." },
      { property: "og:title", content: "Freelance OS — Run freelance like a studio" },
      { property: "og:description", content: "Projects, deadlines, voice alerts, revenue and an AI coach in one beautiful workspace." },
    ],
  }),
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

      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-5 sm:px-6 py-5 sticky top-0 z-30 backdrop-blur-md bg-background/40">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Freelance OS</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#testimonials" className="hover:text-foreground transition">Loved by</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button></Link>
          <Link to="/auth"><Button variant="hero" size="sm">Get started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-5 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs sm:text-sm text-muted-foreground animate-fade-in">
          <span className="size-1.5 rounded-full bg-[--accent-emerald] animate-pulse-ring" />
          Your personal assistant for freelance work
        </div>
        <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight animate-rise leading-[1.05]">
          Run your freelance business <br className="hidden sm:block" />
          <span className="gradient-text">like a studio.</span>
        </h1>
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-rise" style={{ animationDelay: "100ms" }}>
          Projects, deadlines, meetings, revenue, and an AI coach — in one beautiful workspace with voice alerts that remind you exactly when it matters.
        </p>
        <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 animate-rise flex-wrap" style={{ animationDelay: "200ms" }}>
          <Link to="/auth">
            <Button size="lg" variant="hero" className="group">
              Start free <ArrowRight className="ml-1 size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="glass">See how it works</Button>
          </a>
        </div>
        <div className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-2">
          <Shield className="size-3.5" /> No credit card · Cancel anytime · Set up in 60 seconds
        </div>

        {/* Hero mock card */}
        <div className="relative mt-14 sm:mt-20 animate-rise" style={{ animationDelay: "300ms" }}>
          <div className="absolute inset-x-0 -top-16 mx-auto h-72 w-[80%] rounded-full opacity-40 blur-3xl [background:var(--gradient-primary)]" />
          <div className="relative rounded-3xl glass-strong ring-gradient overflow-hidden p-3 sm:p-4 mx-auto max-w-4xl shadow-[var(--shadow-glow)]">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Wallet, label: "This month", value: "$12,400", sub: "▲ 24% vs last", accent: "from-[--primary] to-[--primary-glow]" },
                { icon: FolderKanban, label: "Active", value: "8 projects", sub: "3 due this week", accent: "from-[--accent-emerald] to-[--primary]" },
                { icon: CalendarClock, label: "Next meeting", value: "Acme Co.", sub: "in 23 min", accent: "from-[--primary-glow] to-[--accent-emerald]" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card/70 p-4 text-left relative overflow-hidden border border-border/60">
                  <div className={`absolute -top-8 -right-8 size-28 rounded-full opacity-30 blur-2xl bg-gradient-to-br ${s.accent}`} />
                  <div className="flex items-center justify-between relative">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    <div className={`size-8 rounded-lg grid place-items-center bg-gradient-to-br ${s.accent}`}>
                      <s.icon className="size-4 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="mt-3 font-bold text-xl relative">{s.value}</div>
                  <div className="mt-1 text-[11px] text-[--accent-emerald] relative">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card/70 p-4 text-left border border-border/60">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Upcoming deadline</div>
                <div className="font-semibold">Website redesign — Acme</div>
                <div className="text-xs text-muted-foreground mt-1">In 12 hours · $4,200</div>
                <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full [background:var(--gradient-primary)] w-[72%]" />
                </div>
              </div>
              <div className="rounded-2xl bg-card/70 p-4 text-left border border-border/60">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1">
                  <Bot className="size-3" /> AI coach
                </div>
                <div className="text-sm">"You're on pace for a record month — consider raising rates 10% on new projects."</div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary"><Sparkles className="size-3" /> Tap for full report</div>
              </div>
            </div>
          </div>
        </div>

        {/* Logos / trust */}
        <div className="mt-14 sm:mt-20 opacity-80">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Built for solo studios shipping work for</div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-muted-foreground/70 text-sm font-semibold tracking-tight">
            <span>● Acme Co.</span><span>◆ Northwind</span><span>▲ Stripe-ish</span>
            <span>★ Atlas Labs</span><span>◇ Pioneer</span><span>● Loops</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs">
            <Sparkles className="size-3 text-primary" /> Everything you need
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
            One calm workspace, <span className="gradient-text">zero busywork.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop juggling 6 tools. Freelance OS replaces your project board, calendar, reminders, finances and a thinking partner — all in one place.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { icon: FolderKanban, title: "Projects & checklists", desc: "Track every client and deliverable with visual progress and per-project checklists.", accent: "from-[--primary] to-[--primary-glow]" },
            { icon: Bell, title: "Voice deadline alerts", desc: "Hear reminders 24h, 12h and 3h before — never miss a delivery again.", accent: "from-[--accent-emerald] to-[--primary]" },
            { icon: CalendarClock, title: "Meeting reminders", desc: '"Meeting with Acme in 5 minutes." Voice nudges before every call.', accent: "from-[--primary-glow] to-[--accent-emerald]" },
            { icon: BarChart3, title: "Revenue dashboard", desc: "Monthly earnings, growth vs last month and per-project income at a glance.", accent: "from-[--primary] to-[--accent-emerald]" },
            { icon: Bot, title: "AI productivity coach", desc: "Get personalized tips and revenue insights tuned to your craft and goals.", accent: "from-[--accent-emerald] to-[--primary-glow]" },
            { icon: Calendar, title: "Unified calendar", desc: "Meetings and project deliveries together. Plan your week without context-switching.", accent: "from-[--primary-glow] to-[--primary]" },
            { icon: Newspaper, title: "Curated tech feed", desc: "Fresh blogs and tools matched to your craft, every single day.", accent: "from-[--primary] to-[--primary-glow]" },
            { icon: Mic, title: "Three sound modes", desc: "Distinct alert sounds for meetings, deadlines and pending tasks.", accent: "from-[--accent-emerald] to-[--primary]" },
            { icon: Shield, title: "Private by design", desc: "Your data is yours. End-to-end secured with row-level access controls.", accent: "from-[--primary-glow] to-[--accent-emerald]" },
          ].map((f, i) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 hover-lift animate-rise relative overflow-hidden group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute -top-10 -right-10 size-32 rounded-full opacity-25 blur-2xl bg-gradient-to-br transition-transform duration-500 group-hover:scale-125 ${f.accent}`} />
              <div className={`size-11 rounded-xl bg-gradient-to-br ${f.accent} grid place-items-center mb-4 shadow-[var(--shadow-glow)]`}>
                <f.icon className="size-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="rounded-3xl glass-strong p-7 sm:p-12 ring-gradient aurora-bg">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Zap className="size-3 text-primary" /> Get going in 60 seconds
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">From sign-up to shipping in 3 quick steps.</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              { n: "01", title: "Tell us your craft", desc: "Pick your profession & interests during a 30-second onboarding. We tailor everything around you." },
              { n: "02", title: "Add your projects", desc: "Drop in clients, deadlines, prices. Add tasks per project. We turn it into a focused queue." },
              { n: "03", title: "Stay in flow", desc: "Voice alerts, AI tips and revenue charts keep you sharp. No more spreadsheets, no more missed deadlines." },
            ].map((s, i) => (
              <div key={s.n} className="rounded-2xl bg-card/70 p-6 border border-border/60 hover-lift animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="text-5xl font-bold gradient-text leading-none">{s.n}</div>
                <div className="mt-4 font-semibold tracking-tight">{s.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs">
            <Star className="size-3 text-primary" /> Loved by makers
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">A studio in your pocket.</h2>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { quote: "I stopped using 4 apps the day I switched. The voice alerts alone are worth it — I never miss a delivery.", who: "Maya R.", role: "Brand Designer" },
            { quote: "The AI coach told me to raise rates by 12%. I did. Best advice I got this year.", who: "Jonas P.", role: "Full-stack Dev" },
            { quote: "Finally a clean revenue view. I see my month at a glance instead of digging through invoices.", who: "Priya K.", role: "Marketing Consultant" },
          ].map((t, i) => (
            <div key={t.who} className="glass rounded-2xl p-6 animate-rise hover-lift" style={{ animationDelay: `${i * 80}ms` }}>
              <Quote className="size-5 text-primary" />
              <p className="mt-3 text-sm leading-relaxed">{t.quote}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="size-9 rounded-full [background:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold text-sm">{t.who[0]}</div>
                <div>
                  <div className="text-sm font-semibold">{t.who}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs">
            <Rocket className="size-3 text-primary" /> Simple pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">Free while we're early.</h2>
          <p className="mt-3 text-muted-foreground">Get the entire studio toolkit at zero cost during launch.</p>
        </div>
        <div className="mt-10 max-w-md mx-auto">
          <div className="rounded-3xl glass-strong p-7 sm:p-9 ring-gradient text-center relative overflow-hidden">
            <div className="absolute inset-x-0 -top-20 mx-auto h-44 w-[60%] rounded-full opacity-40 blur-3xl [background:var(--gradient-primary)]" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Studio plan</div>
              <div className="mt-3 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-left max-w-xs mx-auto">
                {[
                  "Unlimited projects & tasks",
                  "Voice alerts (meetings, deadlines, tasks)",
                  "Revenue dashboard & growth charts",
                  "AI productivity coach",
                  "Curated tech & growth blogs",
                  "Calendar & meeting reminders",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-[--accent-emerald] shrink-0 mt-0.5" /> {x}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="block mt-7">
                <Button variant="hero" size="lg" className="w-full">Start free <ArrowRight className="size-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-5 sm:px-6 pb-20 sm:pb-28">
        <div className="rounded-3xl glass-strong p-8 sm:p-14 text-center ring-gradient aurora-bg relative overflow-hidden">
          <Headphones className="size-8 mx-auto text-primary" />
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
            Build a studio you actually <span className="gradient-text">enjoy running.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Sign up free. Set up your first project in under a minute. Let voice alerts and the AI coach do the heavy lifting.
          </p>
          <Link to="/auth" className="inline-block mt-7">
            <Button variant="hero" size="lg" className="group">
              Get started — it's free <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md [background:var(--gradient-primary)] grid place-items-center">
              <Sparkles className="size-3 text-primary-foreground" />
            </div>
            <span>Freelance OS · made for solo studios</span>
          </div>
          <div>© {new Date().getFullYear()} Freelance OS</div>
        </div>
      </footer>
    </div>
  );
}
