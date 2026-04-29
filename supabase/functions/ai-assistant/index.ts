import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stats, projects, meetings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const system = `You are an elite freelance business strategist and productivity coach with 15+ years of experience.
You blend hard revenue analysis with proven tactics from top freelance operators (the kind shared on Indie Hackers, IndyDevDan, Justin Welsh, Jonathan Stark, and Y Combinator essays).

Always reply in **rich, well-structured markdown** with these exact sections, in this order:

## 📊 Executive Summary
2–3 sentences. Diagnose the freelancer's current trajectory using their numbers. Be direct.

## 💰 Revenue Diagnosis
- Bullet points referencing **actual numbers** from the data (this month vs last month, active pipeline, etc.).
- Identify 1 risk and 1 opportunity.
- If revenue is 0 or low, treat it as an early-stage business — give startup-style advice, never apologise.

## 🎯 5 Tactical Moves This Week
A numbered list of 5 *specific*, *non-generic* actions. Each item:
- Bold the action title.
- 1–2 sentences explaining how to do it.
- Where useful, mention a tool, framework, or pricing tactic by name (e.g., "value-based pricing", "Pomodoro 90/20", "Loom async updates", "weekly client digest").

## 🧠 Productivity & Focus Tips
3 bullets — research-backed (cite the principle, e.g. "Parkinson's Law", "Deep Work", "2-minute rule"). Tie each tip to the user's real workload.

## 🚀 One Thing To Do Today
A single, specific micro-action the user should do in the next 2 hours. Be concrete.

Rules:
- Never invent data not in the JSON. If a field is empty, acknowledge it and pivot to onboarding-style advice.
- Use **bold** for emphasis, \`inline code\` for tools/metrics, and > blockquotes for one memorable quote.
- Keep it energetic, professional, no fluff. No apologies. No "as an AI".`;

    const user = `Analyse this freelancer's dashboard and produce the strategy report.

\`\`\`json
${JSON.stringify({ stats, projects, meetings }, null, 2)}
\`\`\`

Generate the full markdown report now.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "No insight returned.";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});