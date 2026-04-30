import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Palette, Code2, PenLine,
  Camera, Megaphone, Briefcase, Video, Mic, BarChart3, ShoppingBag,
  GraduationCap, BadgeCheck, Rocket, Brain, Zap,
} from "lucide-react";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Freelance OS" }] }),
  component: OnboardingPage,
});

const PROFESSIONS = [
  { id: "designer", label: "Designer", desc: "UI / UX / Brand / Product", icon: Palette, tags: ["design", "ux", "ui"] },
  { id: "developer", label: "Developer", desc: "Web, mobile, full-stack", icon: Code2, tags: ["webdev", "javascript", "programming"] },
  { id: "writer", label: "Writer", desc: "Copy, content, blog", icon: PenLine, tags: ["writing", "content", "copywriting"] },
  { id: "photographer", label: "Photographer", desc: "Photo & retouching", icon: Camera, tags: ["photography", "creative"] },
  { id: "marketer", label: "Marketer", desc: "Ads, growth, conversion", icon: Megaphone, tags: ["marketing", "growth", "conversion"] },
  { id: "consultant", label: "Consultant", desc: "Strategy, ops, advisory", icon: Briefcase, tags: ["business", "consulting", "strategy"] },
  { id: "videographer", label: "Video creator", desc: "Editing, motion, film", icon: Video, tags: ["video", "creative", "editing"] },
  { id: "podcaster", label: "Podcaster", desc: "Audio & shows", icon: Mic, tags: ["podcast", "audio"] },
  { id: "analyst", label: "Data / Analyst", desc: "Insights & dashboards", icon: BarChart3, tags: ["data", "analytics", "ai"] },
  { id: "ecommerce", label: "E-commerce", desc: "Shop owner / DTC", icon: ShoppingBag, tags: ["ecommerce", "shopify", "conversion"] },
  { id: "coach", label: "Coach / Educator", desc: "Courses & mentoring", icon: GraduationCap, tags: ["productivity", "career"] },
  { id: "other", label: "Something else", desc: "Tell us your craft", icon: BadgeCheck, tags: ["productivity"] },
];

const LEVELS = [
  { id: "junior", label: "Just starting", desc: "0–2 yrs · learning the ropes", icon: Rocket },
  { id: "mid", label: "Established", desc: "2–6 yrs · steady client base", icon: Zap },
  { id: "senior", label: "Senior pro", desc: "6+ yrs · scaling & specialising", icon: Brain },
];

const INTERESTS = [
  { id: "conversion", label: "Conversion tracking", emoji: "📈" },
  { id: "ai", label: "AI tools", emoji: "🤖" },
  { id: "growth", label: "Growth hacks", emoji: "🚀" },
  { id: "productivity", label: "Productivity", emoji: "⚡️" },
  { id: "marketing", label: "Marketing", emoji: "🎯" },
  { id: "webdev", label: "Web dev", emoji: "💻" },
  { id: "design", label: "Design trends", emoji: "🎨" },
  { id: "freelance", label: "Freelance biz", emoji: "💼" },
  { id: "career", label: "Career", emoji: "🌱" },
  { id: "money", label: "Pricing & money", emoji: "💰" },
  { id: "tools", label: "Tools & apps", emoji: "🛠️" },
  { id: "saas", label: "SaaS", emoji: "☁️" },
];

function OnboardingPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<string>("");
  const [expertise, setExpertise] = useState("");
  const [level, setLevel] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, profession, expertise, experience_level, interests, onboarded")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.onboarded) { nav({ to: "/dashboard" }); return; }
      setName(data?.display_name ?? user.email?.split("@")[0] ?? "");
      setProfession(data?.profession ?? "");
      setExpertise(data?.expertise ?? "");
      setLevel(data?.experience_level ?? "");
      setInterests((data?.interests as string[] | null) ?? []);
    })();
  }, [user, loading, nav]);

  const total = 4;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        profession: profession || null,
        expertise: expertise.trim() || null,
        experience_level: level || null,
        interests,
        onboarded: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Welcome aboard, ${name.split(" ")[0] || "friend"} ✨`);
    nav({ to: "/dashboard" });
  };

  const canNext = [
    !!name.trim(),
    !!profession,
    !!level,
    interests.length >= 2,
  ][step];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="absolute inset-0 -z-10 [background-image:var(--gradient-hero)] opacity-90" />
      <div className="min-h-screen flex flex-col">
        <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)]">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Freelance OS</span>
          </div>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {total}</span>
        </header>

        {/* progress */}
        <div className="px-5 sm:px-8">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden max-w-3xl mx-auto">
            <div className="h-full [background:var(--gradient-primary)] transition-all duration-500"
                 style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
        </div>

        <main className="flex-1 px-5 sm:px-8 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            {step === 0 && (
              <div className="animate-rise">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
                  Let's set up your <span className="gradient-text">studio</span>.
                </h1>
                <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-xl">
                  A 60-second intro so we can tailor blogs, tips and revenue insights specifically for you.
                </p>
                <div className="mt-8 glass-strong rounded-2xl p-6 sm:p-7 ring-gradient max-w-lg">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your name</Label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="mt-2 h-12 text-lg"
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground mt-3">We'll use your first name throughout the dashboard.</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-rise">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  What's your <span className="gradient-text">craft</span>, {name.split(" ")[0] || "friend"}?
                </h2>
                <p className="text-muted-foreground mt-2">Pick the closest match — we'll personalise your blog feed and AI tips.</p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PROFESSIONS.map((p) => {
                    const active = profession === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setProfession(p.id)}
                        className={cn(
                          "text-left rounded-2xl p-4 transition-all border relative overflow-hidden group",
                          active
                            ? "border-transparent ring-2 ring-primary [background:color-mix(in_oklab,var(--primary)_18%,var(--card))] shadow-[var(--shadow-glow)]"
                            : "border-border bg-card/60 hover:bg-card hover:-translate-y-0.5"
                        )}
                      >
                        <div className={cn(
                          "size-10 rounded-xl grid place-items-center mb-2.5 transition-all",
                          active ? "[background:var(--gradient-primary)] text-primary-foreground" : "bg-secondary text-foreground"
                        )}>
                          <p.icon className="size-5" />
                        </div>
                        <div className="font-semibold text-sm">{p.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                        {active && <Check className="absolute top-3 right-3 size-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 max-w-lg">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your specialty (optional)</Label>
                  <Input
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g. SaaS landing pages, brand identity, React + Stripe…"
                    className="mt-2 h-11"
                    maxLength={140}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-rise">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Where are you in your <span className="gradient-text">journey</span>?
                </h2>
                <p className="text-muted-foreground mt-2">We'll calibrate AI insights to match your stage.</p>
                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                  {LEVELS.map((l) => {
                    const active = level === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        className={cn(
                          "text-left rounded-2xl p-5 border transition-all relative",
                          active
                            ? "border-transparent ring-2 ring-primary [background:color-mix(in_oklab,var(--primary)_15%,var(--card))] shadow-[var(--shadow-glow)]"
                            : "border-border bg-card/60 hover:-translate-y-0.5"
                        )}
                      >
                        <div className={cn(
                          "size-12 rounded-2xl grid place-items-center mb-3",
                          active ? "[background:var(--gradient-primary)] text-primary-foreground" : "bg-secondary"
                        )}>
                          <l.icon className="size-5" />
                        </div>
                        <div className="font-semibold">{l.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{l.desc}</div>
                        {active && <Check className="absolute top-4 right-4 size-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-rise">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Pick your <span className="gradient-text">interests</span>.
                </h2>
                <p className="text-muted-foreground mt-2">Choose 2 or more — we'll surface fresh blog content matching these every day.</p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {INTERESTS.map((tag) => {
                    const active = interests.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => setInterests((s) => active ? s.filter((x) => x !== tag.id) : [...s, tag.id])}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm transition-all border inline-flex items-center gap-2",
                          active
                            ? "[background:var(--gradient-primary)] text-primary-foreground border-transparent shadow-[var(--shadow-glow)]"
                            : "border-border bg-card/60 hover:bg-card"
                        )}
                      >
                        <span>{tag.emoji}</span>
                        {tag.label}
                        {active && <Check className="size-3.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4">Selected: {interests.length}</p>
              </div>
            )}
          </div>
        </main>

        <footer className="px-5 sm:px-8 py-5 border-t border-border/60 backdrop-blur-md bg-background/60 sticky bottom-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < total - 1 ? (
              <Button variant="hero" onClick={next} disabled={!canNext}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={finish} disabled={!canNext || busy}>
                {busy ? "Saving…" : "Enter Freelance OS"} <Sparkles className="size-4" />
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
