import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Freelance OS" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
    } catch (e: any) {
      toast.error(e.message ?? "Failed to get insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Get personalized revenue insights and productivity tips.</p>
      </div>

      <Card className="glass border-0 p-8 text-center animate-rise relative overflow-hidden">
        <div className="absolute inset-0 [background-image:var(--gradient-hero)] opacity-50 -z-10" />
        <div className="size-16 rounded-2xl [background:var(--gradient-primary)] grid place-items-center mx-auto shadow-[var(--shadow-glow)] animate-float">
          <Sparkles className="size-7 text-primary-foreground" />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Analyze my freelance business</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Your projects, meetings, and revenue will be analyzed to suggest concrete improvements.
        </p>
        <Button onClick={analyze} disabled={loading} variant="hero" size="lg" className="mt-6">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Thinking...</> : <><Sparkles className="size-4" /> Generate insight</>}
        </Button>
      </Card>

      {content && (
        <Card className="glass border-0 p-6 animate-rise">
          <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
            {content}
          </article>
        </Card>
      )}
    </div>
  );
}