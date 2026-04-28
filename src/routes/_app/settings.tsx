import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { playSound, speak } from "@/lib/notifications";
import { Sun, Moon, Volume2, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Freelance OS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

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
    </div>
  );
}