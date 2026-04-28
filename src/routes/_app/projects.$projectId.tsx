import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { playSound } from "@/lib/notifications";

export const Route = createFileRoute("/_app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — Freelance OS" }] }),
  component: ProjectDetail,
});

type Project = {
  id: string; title: string; client_name: string | null; price: number;
  deadline: string | null; status: "pending" | "in_progress" | "completed";
};
type Task = { id: string; title: string; done: boolean; position: number };

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const load = async () => {
    const [{ data: p }, { data: ts }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("tasks").select("*").eq("project_id", projectId).order("position"),
    ]);
    setProject(p as Project | null);
    setTasks((ts as Task[]) ?? []);
  };
  useEffect(() => { load(); }, [projectId]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTask.trim();
    if (!title || !user) return;
    if (title.length > 200) { toast.error("Too long"); return; }
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, project_id: projectId, title, position: tasks.length,
    });
    if (error) toast.error(error.message);
    setNewTask("");
    load();
  };

  const toggle = async (t: Task) => {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    if (!t.done) playSound("task");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  const deleteProject = async () => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await supabase.from("projects").delete().eq("id", projectId);
    nav({ to: "/projects" });
  };

  if (!project) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? (done / tasks.length) * 100 : 0;
  const ms = project.deadline ? new Date(project.deadline).getTime() - Date.now() : null;
  const hours = ms !== null ? Math.max(0, Math.round(ms / 3600000)) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to projects
      </Link>

      <Card className="glass border-0 p-6 animate-rise">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground mt-1">{project.client_name ?? "No client"}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={deleteProject} title="Delete project">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Stat icon={DollarSign} label="Price" value={`$${Number(project.price).toLocaleString()}`} />
          <Stat icon={Clock} label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—"} />
          <Stat icon={Clock} label="Time left" value={hours !== null ? (hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`) : "—"} />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span>{done} / {tasks.length}</span>
          </div>
          <Progress value={pct} />
        </div>
      </Card>

      <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "100ms" }}>
        <h2 className="font-semibold text-lg mb-4">Checklist</h2>
        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task..." maxLength={200} />
          <Button type="submit" variant="hero"><Plus className="size-4" /></Button>
        </form>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No tasks yet. Add some above.</p>
        ) : (
          <ul className="space-y-1.5">
            {tasks.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-all hover:translate-x-1 animate-rise"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} />
                <span className={t.done ? "flex-1 line-through text-muted-foreground" : "flex-1"}>{t.title}</span>
                <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" /> {label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}