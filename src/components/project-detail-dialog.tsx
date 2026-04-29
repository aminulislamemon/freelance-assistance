import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Clock, DollarSign, User2, Calendar as CalIcon, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { playSound } from "@/lib/notifications";

type Status = "pending" | "in_progress" | "completed" | "cancelled";
type Project = {
  id: string; title: string; client_name: string | null; price: number;
  deadline: string | null; status: Status; description: string | null;
};
type Task = { id: string; title: string; done: boolean; position: number };

export function ProjectDetailDialog({
  projectId, onOpenChange, onChanged,
}: {
  projectId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [editing, setEditing] = useState(false);
  const [draftDesc, setDraftDesc] = useState("");

  const open = !!projectId;

  useEffect(() => {
    if (!projectId) { setProject(null); setTasks([]); return; }
    (async () => {
      const [{ data: p }, { data: ts }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase.from("tasks").select("*").eq("project_id", projectId).order("position"),
      ]);
      setProject(p as Project | null);
      setDraftDesc(((p as any)?.description as string) ?? "");
      setTasks((ts as Task[]) ?? []);
    })();
  }, [projectId]);

  const reload = async () => {
    if (!projectId) return;
    const [{ data: p }, { data: ts }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("tasks").select("*").eq("project_id", projectId).order("position"),
    ]);
    setProject(p as Project | null);
    setTasks((ts as Task[]) ?? []);
    onChanged?.();
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTask.trim();
    if (!title || !user || !projectId) return;
    if (title.length > 200) return toast.error("Too long");
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, project_id: projectId, title, position: tasks.length,
    });
    if (error) return toast.error(error.message);
    setNewTask("");
    reload();
  };

  const toggle = async (t: Task) => {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    if (!t.done) playSound("task");
    reload();
  };

  const remove = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    reload();
  };

  const saveDescription = async () => {
    if (!projectId) return;
    await supabase.from("projects").update({ description: draftDesc || null }).eq("id", projectId);
    setEditing(false);
    toast.success("Description saved");
    reload();
  };

  const deleteProject = async () => {
    if (!projectId) return;
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    await supabase.from("projects").delete().eq("id", projectId);
    onOpenChange(false);
    onChanged?.();
  };

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? (done / tasks.length) * 100 : 0;
  const ms = project?.deadline ? new Date(project.deadline).getTime() - Date.now() : null;
  const hours = ms !== null ? Math.max(0, Math.round(ms / 3600000)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-strong border-0 max-h-[90vh] overflow-y-auto">
        {!project ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-2xl [background:var(--gradient-primary)] grid place-items-center text-primary-foreground font-bold shadow-[var(--shadow-glow)] shrink-0">
                  {project.title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-2xl truncate">{project.title}</DialogTitle>
                  <DialogDescription className="mt-0.5 capitalize">{project.status.replace("_", " ")}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <Stat icon={User2} label="Client" value={project.client_name ?? "—"} />
              <Stat icon={DollarSign} label="Price" value={`$${Number(project.price).toLocaleString()}`} />
              <Stat icon={CalIcon} label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"} />
              <Stat icon={Clock} label="Time left" value={hours !== null ? (hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`) : "—"} />
            </div>

            {/* Description */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
                {!editing ? (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="size-3.5" /> Edit</Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraftDesc(project.description ?? ""); }}><X className="size-3.5" /></Button>
                    <Button size="sm" variant="hero" onClick={saveDescription}><Save className="size-3.5" /> Save</Button>
                  </div>
                )}
              </div>
              {editing ? (
                <Textarea value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} rows={3} maxLength={2000} className="resize-none" placeholder="Scope, deliverables, key notes…" />
              ) : (
                <p className="text-sm text-muted-foreground rounded-xl bg-secondary/40 p-3 min-h-[3rem]">
                  {project.description || "No description yet."}
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Checklist progress</span>
                <span className="font-medium">{done} / {tasks.length}</span>
              </div>
              <Progress value={pct} />
            </div>

            {/* Checklist */}
            <div className="mt-2">
              <form onSubmit={addTask} className="flex gap-2 mb-3">
                <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" maxLength={200} />
                <Button type="submit" variant="hero"><Plus className="size-4" /></Button>
              </form>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet — add one above.</p>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {tasks.map((t, i) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-all hover:translate-x-1 animate-rise"
                      style={{ animationDelay: `${i * 25}ms` }}
                    >
                      <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} />
                      <span className={t.done ? "flex-1 line-through text-muted-foreground text-sm" : "flex-1 text-sm"}>{t.title}</span>
                      <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={deleteProject}>
                <Trash2 className="size-4" /> Delete project
              </Button>
              <Button variant="glass" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Icon className="size-3" /> {label}</div>
      <div className="mt-1 font-semibold text-sm truncate">{value}</div>
    </div>
  );
}
