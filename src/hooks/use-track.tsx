import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Logs page views to user_events and updates profiles.last_active_at.
 * Mount once at the app shell level.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user || !path) return;
    const page = path.replace(/^\//, "").split("/")[0] || "dashboard";
    // Fire-and-forget; ignore errors silently
    supabase.from("user_events").insert({
      user_id: user.id,
      event_type: "page_view",
      page,
      metadata: { full_path: path },
    }).then(() => {});
    supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id).then(() => {});
  }, [user, path]);
}

/** Log an arbitrary event. Safe to call without awaiting. */
export async function trackEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
  page?: string,
) {
  try {
    await supabase.from("user_events").insert({
      user_id: userId,
      event_type: eventType,
      page: page ?? null,
      metadata: (metadata ?? {}) as never,
    });
  } catch {
    /* noop */
  }
}