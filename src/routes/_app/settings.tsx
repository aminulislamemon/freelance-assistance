import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { playSound, speak } from "@/lib/notifications";
import { Sun, Moon, Volume2, LogOut, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Freelance OS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      setDeleting(false);
      toast.error(error.message);
      return;
    }
    toast.success("Account marked for deletion. You can recover it within 90 days.");
    await signOut();
    nav({ to: "/" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Account, theme, and notification preview.</p>
      </div>

      <Card className="glass border-0 p-6 animate-rise">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        <Button variant="outline" className="mt-4" onClick={() => signOut()}><LogOut className="size-4" /> Sign out</Button>
      </Card>

      <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "60ms" }}>
        <h2 className="font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">Theme is currently <strong>{theme}</strong>.</p>
        <Button variant="glass" className="mt-4" onClick={toggle}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          Switch to {theme === "dark" ? "light" : "dark"}
        </Button>
      </Card>

      <Card className="glass border-0 p-6 animate-rise" style={{ animationDelay: "120ms" }}>
        <h2 className="font-semibold">Notification sounds</h2>
        <p className="text-sm text-muted-foreground mt-1">Each event has a unique sound and a voice alert.</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-2">
          <Button variant="glass" onClick={() => { playSound("meeting"); speak("Meeting reminder."); }}><Volume2 className="size-4" /> Meeting</Button>
          <Button variant="glass" onClick={() => { playSound("deadline"); speak("Deadline alert."); }}><Volume2 className="size-4" /> Deadline</Button>
          <Button variant="glass" onClick={() => { playSound("task"); speak("Task complete."); }}><Volume2 className="size-4" /> Task</Button>
        </div>
      </Card>

      <Card className="border border-destructive/30 bg-destructive/5 p-6 animate-rise" style={{ animationDelay: "180ms" }}>
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-destructive/15 grid place-items-center shrink-0">
            <ShieldAlert className="size-4 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Delete account</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your account and data will be soft-deleted. You can recover it within <strong>90 days</strong> by contacting support — after that it is permanently removed.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="size-4" /> Delete my account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-strong border-0">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out and mark your account for deletion. You have 90 days to recover it before all data is permanently erased.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    </div>
  );
}