import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, BrainCircuit, Lightbulb, TrendingUp, Copy, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Freelance OS" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const [{ data: projects }, { data: meetings }] = await Promise.all([
        supabase.from("projects").select("title,status,price,deadline,completed_at"),
        supabase.from("meetings").select("title,client_name,starts_at").gte("starts_at", new Date().toISOString()).limit(10),
      ]);

      const now = new Date();
      const thisMonth = (projects ?? []).filter((p: any) => p.status === "completed" && p.completed_at && new Date(p.completed_at).getMonth() === now.getMonth()).reduce((s: number, p: any) => s + Number(p.price), 0);
      const lastMonth = (projects ?? []).filter((p: any) => p.status === "completed" && p.completed_at && new Date(p.completed_at).getMonth() === now.getMonth() - 1).reduce((s: number, p: any) => s + Number(p.price), 0);
      const stats = { thisMonth, lastMonth, active: (projects ?? []).filter((p: any) => p.status !== "completed").length };

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { stats, projects, meetings },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data?.content ?? "");
      setGeneratedAt(new Date());
    } catch (e: any) {
      toast.error(e.message ?? "Failed to get insight");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="relative rounded-3xl glass-strong p-7 ring-gradient aurora-bg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
          <BrainCircuit className="size-3 text-primary" /> Personal coach
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1 max-w-xl">
          A senior freelance strategist analyses your revenue, deadlines, and pipeline — then gives you a research-backed action plan.
        </p>
      </div>

      <Card className="glass-strong border-0 p-8 md:p-10 text-center animate-rise aurora-bg">
        <div className="size-16 rounded-2xl [background:var(--gradient-primary)] grid place-items-center mx-auto shadow-[var(--shadow-glow)] animate-float">
          <Sparkles className="size-7 text-primary-foreground" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Generate today's strategy</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          A blend of revenue diagnostics, productivity science and pricing tactics — tailored to your data.
        </p>
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <Button onClick={analyze} disabled={loading} variant="hero" size="lg">
            {loading ? <><Loader2 className="size-4 animate-spin" /> Analysing…</> : <><Sparkles className="size-4" /> {content ? "Regenerate" : "Generate insight"}</>}
          </Button>
          {content && (
            <Button onClick={copy} variant="glass" size="lg">
              <Copy className="size-4" /> Copy report
            </Button>
          )}
        </div>
        <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
          <Pill icon={TrendingUp} title="Revenue diagnosis" body="Spot leaks, underpricing, churn risks." />
          <Pill icon={Lightbulb} title="Tactics & playbooks" body="Concrete moves used by 6-figure freelancers." />
          <Pill icon={BrainCircuit} title="Daily focus" body="The 1 thing to do today, based on your pipeline." />
        </div>
      </Card>

      {content && (
        <Card className="glass-strong border-0 p-0 animate-rise overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-3 bg-gradient-to-r from-[--primary]/5 to-[--accent-emerald]/5">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg [background:var(--gradient-primary)] grid place-items-center">
                <Sparkles className="size-3.5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">Your strategy report</div>
                {generatedAt && (
                  <div className="text-[10px] text-muted-foreground">
                    Generated {generatedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={analyze} disabled={loading}>
              <RefreshCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
          <article className="px-6 md:px-10 py-7 prose prose-sm md:prose-base dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:flex prose-h2:items-center prose-h2:gap-2
            prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
            prose-p:leading-relaxed prose-p:text-foreground/85
            prose-li:my-1 prose-li:marker:text-[--primary]
            prose-strong:text-foreground
            prose-a:text-[--primary] prose-a:no-underline hover:prose-a:underline
            prose-code:rounded-md prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[--primary] prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-[--primary] prose-blockquote:bg-secondary/40 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:py-1 prose-blockquote:px-4
            prose-hr:border-border/60">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </Card>
      )}
    </div>
  );
}

function Pill({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-3 flex gap-3">
      <div className="size-8 rounded-lg bg-[--primary]/15 grid place-items-center shrink-0">
        <Icon className="size-4 text-[--primary]" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{body}</div>
      </div>
    </div>
  );
}