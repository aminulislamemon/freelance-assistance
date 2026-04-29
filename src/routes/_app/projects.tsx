import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus, Clock, DollarSign, CalendarIcon, FolderKanban, User2, Search,
  XCircle, MoreVertical, Ban, CheckCircle2, PlayCircle, PauseCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProjectDetailDialog } from "@/components/project-detail-dialog";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Projects — Freelance OS" }] }),
  component: ProjectsPage,
});

type Status = "pending" | "in_progress" | "completed" | "cancelled";
type Project = {
  id: string; title: string; client_name: string | null; price: number;
  deadline: string | null; status: Status; description: string | null;
};

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  client_name: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0).max(10_000_000),
  deadline: z.date().optional(),
});

const STATUS_META: Record<Status, { label: string; chip: string; dot: string; Icon: any }> = {
  pending: { label: "Pending", chip: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", Icon: PauseCircle },
  in_progress: { label: "In progress", chip: "bg-[--primary]/15 text-[--primary]", dot: "bg-[--primary]", Icon: PlayCircle },
  completed: { label: "Completed", chip: "bg-[--accent-emerald]/15 text-[--accent-emerald]", dot: "bg-[--accent-emerald]", Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", chip: "bg-destructive/15 text-destructive", dot: "bg-destructive", Icon: Ban },
};

function ProjectsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setItems((data as Project[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const visible = items
    .filter((i) => filter === "all" || i.status === filter)
    .filter((i) => !query.trim() || i.title.toLowerCase().includes(query.toLowerCase()) || (i.client_name ?? "").toLowerCase().includes(query.toLowerCase()));

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    in_progress: items.filter((i) => i.status === "in_progress").length,
    completed: items.filter((i) => i.status === "completed").length,
    cancelled: items.filter((i) => i.status === "cancelled").length,
  };

  const resetForm = () => {
    setTitle(""); setClientName(""); setDescription(""); setPrice(""); setDeadline(undefined);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      title,
      client_name: clientName || undefined,
      description: description || undefined,
      price: Number(price || 0),
      deadline,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: parsed.data.title,
      client_name: parsed.data.client_name ?? null,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      deadline: parsed.data.deadline ? parsed.data.deadline.toISOString() : null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project created");
    setOpen(false);
    resetForm();
    load();
  };

  const updateStatus = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    await supabase.from("projects").update(patch).eq("id", id);
    load();
  };

  const cancelOrder = async (id: string, title: string) => {
    if (!confirm(`Cancel "${title}"? You can reopen it later by changing the status.`)) return;
    await updateStatus(id, "cancelled");
    toast.info("Project cancelled");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative rounded-3xl glass-strong p-7 ring-gradient aurora-bg">
        <div className="relative flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <FolderKanban className="size-3 text-primary" /> {counts.all} total
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">All client work — from kick-off to delivery.</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button variant="hero"><Plus className="size-4" /> New project</Button></DialogTrigger>
            <DialogContent className="max-w-xl glass-strong border-0">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create a new project</DialogTitle>
                <DialogDescription>Capture the essentials — you can add tasks and refine later.</DialogDescription>
              </DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div>
                  <Label>Project title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website redesign for Acme" required maxLength={120} className="mt-1.5" />
                </div>
                <div>
                  <Label>Client name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Optional" maxLength={120} className="mt-1.5" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Scope, deliverables, key notes…"
                    maxLength={2000}
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, "");
                        // strip leading zeros (but allow "0." for decimals)
                        const cleaned = v.replace(/^0+(?=\d)/, "");
                        setPrice(cleaned);
                      }}
                      placeholder="0"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("mt-1.5 w-full justify-start text-left font-normal h-9", !deadline && "text-muted-foreground")}
                        >
                          <CalendarIcon className="size-4" />
                          {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-strong border-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={setDeadline}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" variant="hero" disabled={submitting}>{submitting ? "Creating…" : "Create project"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "in_progress", "completed", "cancelled"] as const).map((s) => {
            const active = filter === s;
            const count = (counts as any)[s] as number;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm transition-all inline-flex items-center gap-2",
                  active
                    ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects or clients…" className="pl-9" />
        </div>
      </div>

      {/* Vertical project list */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2,3].map((i) => <div key={i} className="h-28 rounded-2xl bg-secondary/40 animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card className="glass border-0 p-16 text-center">
          <p className="text-muted-foreground">No projects match. Try a different filter or create one ✨</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((p, i) => (
            <ProjectRow
              key={p.id}
              p={p}
              i={i}
              onOpen={() => setOpenDetailId(p.id)}
              onStatus={updateStatus}
              onCancel={() => cancelOrder(p.id, p.title)}
            />
          ))}
        </div>
      )}

      <ProjectDetailDialog
        projectId={openDetailId}
        onOpenChange={(o) => !o && setOpenDetailId(null)}
        onChanged={load}
      />
    </div>
  );
}

function ProjectRow({
  p, i, onOpen, onStatus, onCancel,
}: {
  p: Project; i: number;
  onOpen: () => void;
  onStatus: (id: string, s: Status) => void;
  onCancel: () => void;
}) {
  const ms = p.deadline ? new Date(p.deadline).getTime() - Date.now() : null;
  const hours = ms !== null ? Math.max(0, Math.round(ms / 3600000)) : null;
  const overdue = ms !== null && ms < 0 && p.status !== "completed";
  const meta = STATUS_META[p.status];
  const cancelled = p.status === "cancelled";

  return (
    <Card
      className={cn(
        "glass border-0 p-5 hover-lift animate-rise group cursor-pointer relative overflow-hidden",
        cancelled && "opacity-65"
      )}
      style={{ animationDelay: `${i * 40}ms` }}
      onClick={onOpen}
    >
      {/* Left status accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", meta.dot)} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="size-12 rounded-2xl [background:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold text-base shrink-0 shadow-[var(--shadow-glow)]">
            {p.title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors", cancelled && "line-through")}>
                {p.title}
              </h3>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.chip)}>
                <meta.Icon className="size-3" /> {meta.label}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-destructive/15 text-destructive">
                  Overdue
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1"><User2 className="size-3" /> {p.client_name ?? "No client"}</span>
              <span className="inline-flex items-center gap-1"><DollarSign className="size-3" /> {Number(p.price).toLocaleString()}</span>
              {p.deadline && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {overdue ? "Overdue" : hours! < 24 ? `${hours}h left` : `${Math.round(hours! / 24)}d left`}
                  <span className="text-muted-foreground/70">• {new Date(p.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                </span>
              )}
            </div>
            {p.description && (
              <p className="text-sm text-muted-foreground/90 mt-2 line-clamp-1">{p.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Select value={p.status} onValueChange={(v) => onStatus(p.id, v as Status)}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {!cancelled && p.status !== "completed" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onCancel}
              title="Cancel order"
            >
              <XCircle className="size-4" />
              <span className="hidden sm:inline">Cancel order</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onOpen} title="Open">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
