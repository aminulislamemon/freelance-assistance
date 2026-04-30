import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarDays, ChevronLeft, ChevronRight, Users, FolderKanban,
  Clock, Sparkles, ListFilter,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  addMonths, subMonths, isToday, isSameMonth, startOfWeek, endOfWeek,
} from "date-fns";

export const Route = createFileRoute("/_app/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Freelance OS" },
      { name: "description", content: "All your meetings and project deliveries on one beautiful calendar." },
    ],
  }),
  component: CalendarPage,
});

type Meeting = { id: string; title: string; client_name: string | null; starts_at: string };
type Project = { id: string; title: string; client_name: string | null; deadline: string | null; status: string };

type EventItem = {
  id: string;
  type: "meeting" | "delivery";
  title: string;
  client: string | null;
  date: Date;
  status?: string;
};

function CalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const [filter, setFilter] = useState<"all" | "meetings" | "deliveries">("all");

  useEffect(() => {
    (async () => {
      const [{ data: ms }, { data: ps }] = await Promise.all([
        supabase.from("meetings").select("id,title,client_name,starts_at"),
        supabase.from("projects").select("id,title,client_name,deadline,status").not("deadline", "is", null),
      ]);
      setMeetings((ms as Meeting[]) ?? []);
      setProjects((ps as Project[]) ?? []);
    })();
  }, []);

  const events: EventItem[] = useMemo(() => {
    const m: EventItem[] = meetings.map((x) => ({
      id: `m-${x.id}`, type: "meeting", title: x.title, client: x.client_name, date: new Date(x.starts_at),
    }));
    const d: EventItem[] = projects
      .filter((p) => p.deadline && p.status !== "cancelled")
      .map((x) => ({
        id: `d-${x.id}`, type: "delivery", title: x.title, client: x.client_name, date: new Date(x.deadline!), status: x.status,
      }));
    return [...m, ...d].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [meetings, projects]);

  const visibleEvents = events.filter((e) =>
    filter === "all" || (filter === "meetings" ? e.type === "meeting" : e.type === "delivery")
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of visibleEvents) {
      const k = format(e.date, "yyyy-MM-dd");
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [visibleEvents]);

  // For mini-grid (custom month view)
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];

  const upcoming = visibleEvents
    .filter((e) => e.date.getTime() >= Date.now() - 86_400_000)
    .slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative rounded-3xl glass-strong p-6 sm:p-7 ring-gradient aurora-bg">
        <div className="relative flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3 text-primary" /> {events.length} total events
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1 text-sm">Meetings and project deliveries — your week at a glance.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/meetings"><Button variant="glass" size="sm"><Users className="size-4" /> Meetings</Button></Link>
            <Link to="/projects"><Button variant="hero" size="sm"><FolderKanban className="size-4" /> Projects</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Custom Month Grid */}
        <Card className="glass border-0 p-4 sm:p-6 animate-rise">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-bold">{format(month, "MMMM yyyy")}</h2>
              <p className="text-xs text-muted-foreground">Click a day to see its agenda.</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="hidden sm:flex items-center gap-1 mr-2 bg-secondary rounded-full p-1 text-xs">
                {(["all", "meetings", "deliveries"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-2.5 py-1 rounded-full transition-all capitalize",
                      filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft className="size-4" /></Button>
              <Button variant="glass" size="sm" onClick={() => { setMonth(new Date()); setSelected(new Date()); }}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="size-4" /></Button>
            </div>
          </div>

          <div className="sm:hidden mb-3 flex bg-secondary rounded-full p-1 text-xs">
            {(["all", "meetings", "deliveries"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("flex-1 px-2 py-1 rounded-full transition-all capitalize",
                  filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                {f}
              </button>
            ))}
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center py-1.5">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {days.map((d, i) => {
              const k = format(d, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(k) ?? [];
              const sel = isSameDay(d, selected);
              const today = isToday(d);
              const out = !isSameMonth(d, month);
              const meetCount = dayEvents.filter((e) => e.type === "meeting").length;
              const deliverCount = dayEvents.filter((e) => e.type === "delivery").length;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  className={cn(
                    "relative aspect-square sm:aspect-auto sm:min-h-[78px] rounded-xl p-1.5 sm:p-2 text-left transition-all border",
                    "flex flex-col items-stretch",
                    sel
                      ? "[background:var(--gradient-primary)] text-primary-foreground border-transparent shadow-[var(--shadow-glow)]"
                      : today
                      ? "border-primary/40 bg-card hover:bg-card/80"
                      : "border-transparent bg-secondary/40 hover:bg-secondary",
                    out && !sel && "opacity-40"
                  )}
                >
                  <div className={cn("text-xs sm:text-sm font-semibold", sel ? "" : today ? "text-primary" : "text-foreground")}>
                    {format(d, "d")}
                  </div>
                  {/* Event indicators */}
                  <div className="mt-auto flex items-center gap-1 flex-wrap">
                    {meetCount > 0 && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                        sel ? "bg-white/25" : "bg-[--accent-emerald]/20 text-[--accent-emerald]"
                      )}>
                        <Users className="size-2.5" />{meetCount}
                      </span>
                    )}
                    {deliverCount > 0 && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                        sel ? "bg-white/25" : "bg-[--primary]/20 text-[--primary]"
                      )}>
                        <FolderKanban className="size-2.5" />{deliverCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[--accent-emerald]" /> Meeting</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[--primary]" /> Delivery</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full ring-2 ring-primary/40" /> Today</span>
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="glass border-0 p-5 animate-rise" style={{ animationDelay: "60ms" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Selected day</div>
                <div className="font-bold text-lg">{format(selected, "EEEE, MMM d")}</div>
              </div>
              <div className="size-10 rounded-xl [background:var(--gradient-primary)] grid place-items-center text-primary-foreground shadow-[var(--shadow-glow)]">
                <Sparkles className="size-5" />
              </div>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nothing scheduled. A clear day ✨</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((e, i) => <EventRow key={e.id} e={e} i={i} />)}
              </ul>
            )}
          </Card>

          <Card className="glass border-0 p-5 animate-rise" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold inline-flex items-center gap-2"><ListFilter className="size-4 text-primary" /> Coming up</h3>
              <span className="text-xs text-muted-foreground">{upcoming.length}</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All quiet ahead.</p>
            ) : (
              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {upcoming.map((e, i) => <EventRow key={e.id} e={e} i={i} compact />)}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventRow({ e, i, compact }: { e: EventItem; i: number; compact?: boolean }) {
  const isMeeting = e.type === "meeting";
  const Icon = isMeeting ? Users : FolderKanban;
  const dayLabel = isToday(e.date) ? "Today" : format(e.date, "EEE, MMM d");
  return (
    <li
      className="flex items-center gap-3 rounded-xl bg-secondary/50 hover:bg-secondary p-3 transition-all hover:translate-x-1 animate-rise"
      style={{ animationDelay: `${i * 35}ms` }}
    >
      <div className={cn(
        "size-9 rounded-xl grid place-items-center shrink-0",
        isMeeting ? "bg-[--accent-emerald]/15 text-[--accent-emerald]" : "bg-[--primary]/15 text-[--primary]"
      )}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{e.title}</div>
        <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
          <span>{e.client ?? (isMeeting ? "Meeting" : "Delivery")}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3" />
            {compact ? `${dayLabel} · ` : ""}{format(e.date, "h:mm a")}
          </span>
        </div>
      </div>
      <span className={cn(
        "text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0",
        isMeeting ? "bg-[--accent-emerald]/15 text-[--accent-emerald]" : "bg-[--primary]/15 text-[--primary]"
      )}>
        {isMeeting ? "Meeting" : "Delivery"}
      </span>
    </li>
  );
}
