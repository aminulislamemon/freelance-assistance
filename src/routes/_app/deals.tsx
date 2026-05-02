import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Handshake, Trash2, ArrowRight, DollarSign, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/hooks/use-track";

export const Route = createFileRoute("/_app/deals")({
  head: () => ({ meta: [{ title: "Deals — Freelance OS" }] }),
  component: DealsPage,
});

type DealStatus = "open" | "won" | "lost";
type Platform = "fiverr" | "upwork" | "direct" | "other";
type Deal = {
  id: string;
  client_name: string | null;
  agreed_price: number;
  platform: Platform;
  status: DealStatus;
  scope: string | null;
  lead_id: string | null;
  created_at: string;
};

const STATUS_META: Record<DealStatus, { label: string; chip: string; dot: string }> = {
  open: { label: "Open", chip: "bg-[--primary]/15 text-[--primary]", dot: "bg-[--primary]" },
  won: { label: "Won", chip: "bg-[--accent-emerald]/15 text-[--accent-emerald]", dot: "bg-[--accent-emerald]" },
  lost: { label: "Lost", chip: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};

const schema = z.object({
  client_name: z.string().trim().min(1, "Client name required").max(120),
  agreed_price: z.number().min(0).max(10_000_000),
  platform: z.enum(["fiverr", "upwork", "direct", "other"]),
  status: z.enum(["open", "won", "lost"]),
  scope: z.string().trim().max(2000).optional(),
});

function DealsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Deal[]>([]);
  const [filter, setFilter] = useState<"all" | DealStatus>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [clientName, setClientName] = useState("");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState<Platform>("direct");
  const [status, setStatus] = useState<DealStatus>("open");
  const [scope, setScope] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    setItems((data as Deal[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setClientName(""); setPrice(""); setPlatform("direct"); setStatus("open"); setScope(""); };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      client_name: clientName,
      agreed_price: Number(price || 0),
      platform, status,
      scope: scope || undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("deals").insert({
      user_id: user.id,
      client_name: parsed.data.client_name,
      agreed_price: parsed.data.agreed_price,
      platform: parsed.data.platform,
      status: parsed.data.status,
      scope: parsed.data.scope ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    trackEvent(user.id, "deal_created", { source: "deals_page", platform });
    toast.success("Deal added");
    reset(); setOpen(false); load();
  };

  const setDealStatus = async (id: string, s: DealStatus) => {
    await supabase.from("deals").update({ status: s }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    await supabase.from("deals").delete().eq("id", id);
    load();
  };

  const promoteToProject = async (d: Deal) => {
    if (!user) return;
    if (!confirm(`Create a project from "${d.client_name}"?`)) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: d.scope ? d.scope.split("\n")[0].slice(0, 80) : `Project — ${d.client_name ?? "Client"}`,
      client_name: d.client_name,
      price: Number(d.agreed_price),
      platform: d.platform,
      status: "in_progress",
      deal_id: d.id,
      lead_id: d.lead_id,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("deals").update({ status: "won" }).eq("id", d.id);
    trackEvent(user.id, "project_created", { from: "deal" });
    toast.success("Project created from deal");
    load();
  };

  const filtered = items
    .filter((d) => filter === "all" || d.status === filter)
    .filter((d) => !query.trim() || (d.client_name ?? "").toLowerCase().includes(query.toLowerCase()));

  const pipeline = items.filter(d => d.status === "open").reduce((s, d) => s + Number(d.agreed_price), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="relative rounded-3xl glass-strong p-7 ring-gradient aurora-bg">
        <div className="relative flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Handshake className="size-3 text-primary" /> {items.length} deals · ${pipeline.toLocaleString()} open pipeline
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Deals</h1>
            <p className="text-muted-foreground mt-1">Agreed-on work waiting to start. Promote to a project when the brief is locked.</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="size-4" /> Add deal</Button></DialogTrigger>
            <DialogContent className="glass-strong border-0 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl">New deal</DialogTitle>
                <DialogDescription>Capture the agreed scope and price before kick-off.</DialogDescription>
              </DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div>
                  <Label>Client name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required maxLength={120} className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Agreed price ($)</Label>
                    <Input type="text" inputMode="decimal" value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, ""))}
                      placeholder="0" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiverr">Fiverr</SelectItem>
                        <SelectItem value="upwork">Upwork</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as DealStatus)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Scope</Label>
                  <Textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} maxLength={2000} className="mt-1.5 resize-none" placeholder="Deliverables, milestones, acceptance criteria…" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
                  <Button type="submit" variant="hero" disabled={submitting}>{submitting ? "Saving…" : "Add deal"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["all", "open", "won", "lost"] as const).map((s) => {
            const active = filter === s;
            const count = s === "all" ? items.length : items.filter(i => i.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={cn("px-3.5 py-1.5 rounded-full text-sm transition-all inline-flex items-center gap-2",
                  active ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                {s === "all" ? "All" : STATUS_META[s].label}
                <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", active ? "bg-white/20" : "bg-background/60")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative md:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by client…" className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass border-0 p-16 text-center">
          <p className="text-muted-foreground">No deals yet. Convert a lead or add one manually.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((d, i) => {
            const meta = STATUS_META[d.status];
            return (
              <Card key={d.id} className="glass border-0 p-5 hover-lift animate-rise relative overflow-hidden" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={cn("absolute left-0 top-0 bottom-0 w-1", meta.dot)} />
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="size-12 rounded-2xl [background:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold shrink-0 shadow-[var(--shadow-glow)]">
                      {(d.client_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold tracking-tight truncate">{d.client_name ?? "Unnamed"}</h3>
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.chip)}>{meta.label}</span>
                        <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground capitalize">{d.platform}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                        <DollarSign className="size-3" /> {Number(d.agreed_price).toLocaleString()} agreed
                      </div>
                      {d.scope && <p className="text-sm text-muted-foreground/90 mt-2 line-clamp-2">{d.scope}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={d.status} onValueChange={(v) => setDealStatus(d.id, v as DealStatus)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="hero" size="sm" onClick={() => promoteToProject(d)} title="Create project">
                      <ArrowRight className="size-4" /> <span className="hidden sm:inline">To project</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(d.id)} title="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}