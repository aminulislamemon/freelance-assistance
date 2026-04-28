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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, CalendarClock, Mic } from "lucide-react";
import { toast } from "sonner";
import { speak } from "@/lib/notifications";

export const Route = createFileRoute("/_app/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Freelance OS" }] }),
  component: MeetingsPage,
});

type Meeting = { id: string; title: string; client_name: string | null; starts_at: string; notes: string | null };

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  client_name: z.string().trim().max(120).optional(),
  starts_at: z.string().min(1, "Date required"),
  notes: z.string().max(2000).optional(),
});

function MeetingsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("meetings").select("*").order("starts_at");
    setItems((data as Meeting[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const parsed = schema.safeParse({
      title: String(fd.get("title") ?? ""),
      client_name: String(fd.get("client_name") ?? "") || undefined,
      starts_at: String(fd.get("starts_at") ?? ""),
      notes: String(fd.get("notes") ?? "") || undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    const { error } = await supabase.from("meetings").insert({
      user_id: user.id,
      title: parsed.data.title,
      client_name: parsed.data.client_name ?? null,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      notes: parsed.data.notes ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Meeting scheduled");
    setOpen(false);
    form.reset();
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("meetings").delete().eq("id", id);
    load();
  };

  const now = Date.now();
  const upcoming = items.filter((m) => new Date(m.starts_at).getTime() >= now);
  const past = items.filter((m) => new Date(m.starts_at).getTime() < now);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground mt-1">You'll get a voice reminder 15 and 5 minutes before each meeting.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero"><Plus className="size-4" /> New meeting</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule meeting</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create(e.currentTarget); }} className="space-y-4">
              <div><Label>Title</Label><Input name="title" required maxLength={120} /></div>
              <div><Label>Client</Label><Input name="client_name" maxLength={120} /></div>
              <div><Label>Date & time</Label><Input name="starts_at" type="datetime-local" required /></div>
              <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} rows={3} /></div>
              <DialogFooter><Button type="submit" variant="hero">Schedule</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Section title="Upcoming">
        {upcoming.length === 0 ? <Empty /> : upcoming.map((m, i) => <MeetingRow key={m.id} m={m} i={i} onDelete={remove} />)}
      </Section>

      {past.length > 0 && (
        <Section title="Past">
          {past.slice(-10).reverse().map((m, i) => <MeetingRow key={m.id} m={m} i={i} onDelete={remove} faded />)}
        </Section>
      )}
    </div>
  );
}

function MeetingRow({ m, i, onDelete, faded }: { m: Meeting; i: number; onDelete: (id: string) => void; faded?: boolean }) {
  const d = new Date(m.starts_at);
  return (
    <Card
      className={`glass border-0 p-4 flex items-center gap-4 hover-lift animate-rise ${faded ? "opacity-60" : ""}`}
      style={{ animationDelay: `${i * 40}ms` }}
    >
      <div className="size-12 rounded-xl [background:var(--gradient-primary)] grid place-items-center text-primary-foreground shrink-0">
        <CalendarClock className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{m.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {m.client_name ? `${m.client_name} • ` : ""}{d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => speak(`You have a meeting ${m.client_name ? "with " + m.client_name : ""} called ${m.title} on ${d.toLocaleString()}.`)}>
        <Mic className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(m.id)}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </Card>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="font-semibold text-lg mb-3">{title}</h2>
    <div className="space-y-2">{children}</div>
  </div>
);
const Empty = () => <Card className="glass border-0 p-10 text-center text-muted-foreground">Nothing scheduled.</Card>;