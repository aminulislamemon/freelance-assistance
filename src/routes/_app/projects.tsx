import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Clock, DollarSign, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Projects — Freelance OS" }] }),
  component: ProjectsPage,
});

type Project = {
  id: string; title: string; client_name: string | null; price: number;
  deadline: string | null; status: "pending" | "in_progress" | "completed";
};

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  client_name: z.string().trim().max(120).optional(),
  price: z.number().min(0).max(10_000_000),
  deadline: z.string().optional(),
});

function ProjectsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setItems((data as Project[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const visible = items.filter((i) => filter === "all" || i.status === filter);

  const create = async (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const parsed = schema.safeParse({
      title: String(fd.get("title") ?? ""),
      client_name: String(fd.get("client_name") ?? "") || undefined,
      price: Number(fd.get("price") ?? 0),
      deadline: String(fd.get("deadline") ?? "") || undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: parsed.data.title,
      client_name: parsed.data.client_name ?? null,
      price: parsed.data.price,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Project created");
    setOpen(false);
    form.reset();
    load();
  };

  const updateStatus = async (id: string, status: Project["status"]) => {
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    await supabase.from("projects").update(patch).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">All your client work in one place.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero"><Plus className="size-4" /> New project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create(e.currentTarget); }} className="space-y-4">
              <div><Label>Title</Label><Input name="title" required maxLength={120} /></div>
              <div><Label>Client name</Label><Input name="client_name" maxLength={120} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price ($)</Label><Input name="price" type="number" step="0.01" min={0} defaultValue={0} required /></div>
                <div><Label>Deadline</Label><Input name="deadline" type="datetime-local" /></div>
              </div>
              <DialogFooter><Button type="submit" variant="hero">Create</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "in_progress", "completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm transition-all",
              filter === s ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2,3,4,5].map((i) => <div key={i} className="h-44 rounded-2xl bg-secondary/40 animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card className="glass border-0 p-16 text-center">
          <p className="text-muted-foreground">No projects yet. Create your first one ✨</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p, i) => <ProjectCard key={p.id} p={p} i={i} onStatus={updateStatus} />)}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, i, onStatus }: { p: Project; i: number; onStatus: (id: string, s: Project["status"]) => void }) {
  const ms = p.deadline ? new Date(p.deadline).getTime() - Date.now() : null;
  const hours = ms ? Math.max(0, Math.round(ms / 3600000)) : null;
  const overdue = ms !== null && ms < 0;

  const statusColor = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-[--primary]/15 text-[--primary]",
    completed: "bg-[--accent-emerald]/15 text-[--accent-emerald]",
  }[p.status];

  return (
    <Card className="glass border-0 p-5 hover-lift animate-rise group" style={{ animationDelay: `${i * 50}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <Link to="/projects/$projectId" params={{ projectId: p.id }} className="min-w-0 flex-1">
          <h3 className="font-semibold tracking-tight truncate group-hover:text-primary transition-colors">{p.title}</h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{p.client_name ?? "No client"}</p>
        </Link>
        <Link to="/projects/$projectId" params={{ projectId: p.id }} className="text-muted-foreground hover:text-foreground">
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", statusColor)}>
          {p.status.replace("_", " ")}
        </span>
        {hours !== null && (
          <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
            <Clock className="size-3" />
            {overdue ? "Overdue" : hours < 24 ? `${hours}h left` : `${Math.round(hours / 24)}d left`}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 text-lg font-semibold">
          <DollarSign className="size-4 text-muted-foreground" />
          {Number(p.price).toLocaleString()}
        </div>
        <Select value={p.status} onValueChange={(v) => onStatus(p.id, v as Project["status"])}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}