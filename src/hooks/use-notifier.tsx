import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { playSound, speak } from "@/lib/notifications";
import { toast } from "sonner";

type Project = { id: string; title: string; client_name: string | null; deadline: string | null; status: string };
type Meeting = { id: string; title: string; client_name: string | null; starts_at: string };

const WINDOWS_HOURS = [24, 12, 3];
const MEETING_WINDOWS_MIN = [15, 5];

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Polls deadlines & meetings every 60s and fires sound + voice + toast
 * the first time we cross a threshold. Persists fired keys in localStorage.
 */
export function useNotifier() {
  const { user } = useAuth();
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem("fos-fired");
      if (raw) fired.current = new Set(JSON.parse(raw));
    } catch {}

    let cancelled = false;

    const tick = async () => {
      const now = Date.now();
      const [{ data: projects }, { data: meetings }] = await Promise.all([
        supabase.from("projects").select("id,title,client_name,deadline,status").neq("status", "completed"),
        supabase.from("meetings").select("id,title,client_name,starts_at").gte("starts_at", new Date(now - 5 * 60 * 1000).toISOString()),
      ]);

      if (cancelled) return;

      (projects as Project[] | null)?.forEach((p) => {
        if (!p.deadline) return;
        const ms = new Date(p.deadline).getTime() - now;
        if (ms <= 0) return;
        for (const h of WINDOWS_HOURS) {
          const winMs = h * 3600 * 1000;
          const key = `d:${p.id}:${h}`;
          if (ms <= winMs && ms > winMs - 90 * 1000 && !fired.current.has(key)) {
            fired.current.add(key);
            playSound("deadline");
            speak(`Heads up. ${h} hours left until your ${p.title} deadline.`);
            toast.warning(`Deadline in ${h}h`, { description: p.title });
          }
        }
      });

      (meetings as Meeting[] | null)?.forEach((m) => {
        const ms = new Date(m.starts_at).getTime() - now;
        if (ms <= 0) return;
        for (const min of MEETING_WINDOWS_MIN) {
          const winMs = min * 60 * 1000;
          const key = `m:${m.id}:${min}`;
          if (ms <= winMs && ms > winMs - 90 * 1000 && !fired.current.has(key)) {
            fired.current.add(key);
            playSound("meeting");
            const who = m.client_name ? `with ${m.client_name}` : "";
            speak(`You have a meeting ${who} at ${fmtTime(new Date(m.starts_at))}. Starting in ${min} minutes.`);
            toast.info(`Meeting in ${min} min`, { description: m.title });
          }
        }
      });

      try {
        localStorage.setItem("fos-fired", JSON.stringify(Array.from(fired.current)));
      } catch {}
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);
}