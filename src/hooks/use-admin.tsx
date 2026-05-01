import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Returns whether the current user is an admin.
 * Checks user_roles + admin_emails via the is_admin RPC.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    (async () => {
      // Fast path: check user_roles for admin row
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      if (roleRow) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      // Fallback: check allowlist by email
      if (user.email) {
        const { data: allow } = await supabase
          .from("admin_emails")
          .select("email")
          .ilike("email", user.email)
          .maybeSingle();
        if (!cancelled) setIsAdmin(!!allow);
      } else {
        setIsAdmin(false);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { isAdmin, loading };
}