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
import {
  Plus, MessageSquareText, ArrowRight, CalendarPlus, Trash2, Search, Sparkles, User2, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/hooks/use-track";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Leads — Freelance OS" }] }),
  component: LeadsPage,
});

type LeadStatus = "new" | "negotiating" | "won" | "lost";
type LeadSource = "fiverr" | "upwork" | "direct" | "referral" | "other";
type Lead = {
  id: string;
  client_name: string;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  estimated_value: number | null;
  created_at: string;
};

const STATUS_META: Record<LeadStatus, { label: string; chip: string; dot: string }> = {
  new: { label: "New", chip: "bg-[--primary]/15 text-[--primary]", dot: "bg-[--primary]" },
  negotiating: { label: "Negotiating", chip: "bg-amber-500/15 text-amber-500", dot: "bg-amber-500" },
  won: { label: "Won", chip: "bg-[--accent-emerald]/15 text-[--accent-emerald]", dot: "bg-[--accent-emerald]" },
  lost: { label: "Lost", chip: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  fiverr: "Fiverr",
  upwork: "Upwork",
  direct: "Direct",
  referral: "Referral",
  other: "Other",
};

const schema = z.object({
  client_name: z.string().trim().min(1, "Client name required").max(120),
  source: z.enum(["fiverr", "upwork", "direct", "referral", "other"]),
  status: z.enum(["new", "negotiating", "won", "lost"]),
  notes: z.string().trim().max(2000).optional(),
  estimated_value: z.number().min(0).max(10_000_000).optional(),
});

function LeadsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const [clientName, setClientName] = useState("");
  const [source, setSource] = useState<LeadSource>("direct");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [notes, setNotes] = useState("");
  const [estimated, setEstimated] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setItems((data as Lead[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const reset = () => {
    setClientName(""); setSource("direct"); setStatus("new"); setNotes(""); setEstimated("");
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      client_name: clientName,
      source,
      status,
      notes: notes || undefined,
      estimated_value: estimated ? Number(estimated) : undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      user_id: user.id,
      client_name: parsed.data.client_name,
      source: parsed.data.source,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      estimated_value: parsed.data.estimated_value ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    trackEvent(user.id, "lead_created", { source, status });
    toast.success("Lead added");
    reset();
    setOpen(false);
    load();
  };

  const setLeadStatus = async (id: string, s: LeadStatus) => {
    await supabase.from("leads").update({ status: s }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    load();
  };

  const filtered = items
    .filter((l) => filter === "all" || l.status === filter)
    .filter((l) => !query.trim() || l.client_name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative rounded-3xl glass-strong p-7 ring-gradient aurora-bg">
        <div className="relative flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <MessageSquareText className="size-3 text-primary" /> {items.length} conversations
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-1">First conversations and pre-project deals — convert them when ready.</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="size-4" /> Add lead</Button></DialogTrigger>
            <DialogContent className="glass-strong border-0 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl">New lead</DialogTitle>
                <DialogDescription>Capture a new conversation. You can convert it to a deal or project later.</DialogDescription>
              </DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div>
                  <Label>Client name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required maxLength={120} className="mt-1.5" placeholder="e.g. Sarah from Acme" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Source</Label>
                    <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiverr">Fiverr</SelectItem>
                        <SelectItem value="upwork">Upwork</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Estimated value ($)</Label>
                  <Input
                    type="text" inputMode="decimal"
                    value={estimated}
                    onChange={(e) => setEstimated(e.target.value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, ""))}
                    placeholder="0"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} className="mt-1.5 resize-none" placeholder="What did they ask for? Budget? Timeline?" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
                  <Button type="submit" variant="hero" disabled={submitting}>{submitting ? "Saving…" : "Add lead"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["all", "new", "negotiating", "won", "lost"] as const).map((s) => {
            const active = filter === s;
            const count = s === "all" ? items.length : items.filter((i) => i.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm transition-all inline-flex items-center gap-2",
                  active
                    ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "all" ? "All" : STATUS_META[s].label}
                <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", active ? "bg-white/20" : "bg-background/60")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative md:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by client name…" className="pl-9" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="glass border-0 p-16 text-center">
          <p className="text-muted-foreground">No leads here yet. Add one to start tracking conversations ✨</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((l, i) => (
            <LeadRow
              key={l.id}
              lead={l}
              i={i}
              onStatus={setLeadStatus}
              onConvert={() => setConvertLead(l)}
              onDelete={() => remove(l.id)}
            />
          ))}
        </div>
      )}

      <ConvertLeadDialog
        lead={convertLead}
        onClose={() => setConvertLead(null)}
        onDone={() => { setConvertLead(null); load(); }}
      />
    </div>
  );
}

function LeadRow({
  lead, i, onStatus, onConvert, onDelete,
}: {
  lead: Lead;
  i: number;
  onStatus: (id: string, s: LeadStatus) => void;
  onConvert: () => void;
  onDelete: () => void;
}) {
  const meta = STATUS_META[lead.status];
  return (
    <Card
      className="glass border-0 p-5 hover-lift animate-rise relative overflow-hidden"
      style={{ animationDelay: `${i * 40}ms` }}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", meta.dot)} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="size-12 rounded-2xl [background:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold shrink-0 shadow-[var(--shadow-glow)]">
            {lead.client_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold tracking-tight truncate">{lead.client_name}</h3>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.chip)}>{meta.label}</span>
              <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                {SOURCE_LABEL[lead.source]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              {lead.estimated_value !== null && (
                <span className="inline-flex items-center gap-1"><DollarSign className="size-3" /> {Number(lead.estimated_value).toLocaleString()} est.</span>
              )}
              <span className="inline-flex items-center gap-1"><User2 className="size-3" /> {new Date(lead.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            </div>
            {lead.notes && <p className="text-sm text-muted-foreground/90 mt-2 line-clamp-2">{lead.notes}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={lead.status} onValueChange={(v) => onStatus(lead.id, v as LeadStatus)}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="hero" size="sm" onClick={onConvert} title="Convert">
            <ArrowRight className="size-4" /> <span className="hidden sm:inline">Convert</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Convert a lead into a Deal (and optionally a Project) or schedule a meeting. */
function ConvertLeadDialog({ lead, onClose, onDone }: { lead: Lead | null; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"deal" | "project" | "meeting">("deal");
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState<"fiverr" | "upwork" | "direct" | "other">("direct");
  const [scope, setScope] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lead) {
      setPrice(lead.estimated_value ? String(lead.estimated_value) : "");
      setPlatform(lead.source === "referral" ? "direct" : (lead.source as "fiverr" | "upwork" | "direct" | "other"));
      setScope(lead.notes ?? "");
      setMeetingTitle(`Discovery — ${lead.client_name}`);
      setMode("deal");
    }
  }, [lead]);

  if (!lead || !user) return null;

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (mode === "meeting") {
        if (!meetingAt) { toast.error("Pick a date & time"); setBusy(false); return; }
        const { error } = await supabase.from("meetings").insert({
          user_id: user.id,
          title: meetingTitle.trim() || `Meeting — ${lead.client_name}`,
          client_name: lead.client_name,
          starts_at: new Date(meetingAt).toISOString(),
          meeting_type: "lead",
          lead_id: lead.id,
        });
        if (error) throw error;
        trackEvent(user.id, "meeting_scheduled", { from: "lead" });
        toast.success("Meeting scheduled");
      } else if (mode === "deal") {
        const { error } = await supabase.from("deals").insert({
          user_id: user.id,
          lead_id: lead.id,
          client_name: lead.client_name,
          agreed_price: price ? Number(price) : 0,
          platform,
          scope: scope || null,
          status: "open",
        });
        if (error) throw error;
        await supabase.from("leads").update({ status: "won" }).eq("id", lead.id);
        trackEvent(user.id, "deal_created", { from: "lead", platform });
        toast.success("Deal created from lead");
      } else {
        // project
        const { data: deal } = await supabase.from("deals").insert({
          user_id: user.id,
          lead_id: lead.id,
          client_name: lead.client_name,
          agreed_price: price ? Number(price) : 0,
          platform,
          scope: scope || null,
          status: "won",
        }).select().single();
        const { error: pErr } = await supabase.from("projects").insert({
          user_id: user.id,
          title: scope ? scope.split("\n")[0].slice(0, 80) : `Project — ${lead.client_name}`,
          client_name: lead.client_name,
          price: price ? Number(price) : 0,
          platform,
          status: "in_progress",
          lead_id: lead.id,
          deal_id: deal?.id ?? null,
        });
        if (pErr) throw pErr;
        await supabase.from("leads").update({ status: "won" }).eq("id", lead.id);
        trackEvent(user.id, "project_created", { from: "lead", platform });
        toast.success("Project created from lead");
      }
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to convert");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!lead} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="glass-strong border-0 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-[--primary]" /> Convert {lead.client_name}
          </DialogTitle>
          <DialogDescription>Move this lead forward in the lifecycle.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {([
            { v: "deal", label: "→ Deal", desc: "Agreed price" },
            { v: "project", label: "→ Project", desc: "Start work" },
            { v: "meeting", label: "📅 Meeting", desc: "Schedule call" },
          ] as const).map((m) => (
            <button
              key={m.v}
              onClick={() => setMode(m.v)}
              className={cn(
                "rounded-xl p-3 text-left transition-all border",
                mode === m.v ? "[background:var(--gradient-primary)] text-primary-foreground border-transparent shadow-[var(--shadow-glow)]" : "bg-secondary/50 border-border/40 hover:bg-secondary",
              )}
            >
              <div className="text-sm font-semibold">{m.label}</div>
              <div className={cn("text-[11px] mt-0.5", mode === m.v ? "text-primary-foreground/80" : "text-muted-foreground")}>{m.desc}</div>
            </button>
          ))}
        </div>
        {mode === "meeting" ? (
          <div className="space-y-3">
            <div>
              <Label>Meeting title</Label>
              <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} className="mt-1.5" maxLength={120} />
            </div>
            <div>
              <Label>Date & time</Label>
              <Input type="datetime-local" value={meetingAt} onChange={(e) => setMeetingAt(e.target.value)} className="mt-1.5" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Agreed price ($)</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, ""))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
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
              <Label>Scope summary</Label>
              <Textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} maxLength={2000} className="mt-1.5 resize-none" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={busy}>
            {mode === "meeting" ? <CalendarPlus className="size-4" /> : <ArrowRight className="size-4" />}
            {busy ? "Working…" : mode === "meeting" ? "Schedule" : `Create ${mode}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}