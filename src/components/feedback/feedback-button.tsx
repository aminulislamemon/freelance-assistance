import { useState } from "react";
import { MessageSquareHeart, Send, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { trackEvent } from "@/hooks/use-track";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(3, "Tell us a bit more").max(2000),
  feedback_type: z.enum(["bug", "feature", "general"]),
});

export function FeedbackButton({ floating = true }: { floating?: boolean }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"bug" | "feature" | "general">("general");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ rating, message, feedback_type: type });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      rating,
      message: parsed.data.message,
      feedback_type: type,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    trackEvent(user.id, "feedback_sent", { rating, type });
    toast.success("Thanks for the feedback ❤", { description: "We read every single message." });
    setMessage("");
    setRating(5);
    setType("general");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {floating ? (
          <button
            aria-label="Give feedback"
            className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-30 size-12 rounded-full [background:var(--gradient-primary)] grid place-items-center shadow-[var(--shadow-glow)] hover:scale-105 active:scale-95 transition-transform"
          >
            <MessageSquareHeart className="size-5 text-primary-foreground" />
          </button>
        ) : (
          <Button variant="glass" size="sm">
            <MessageSquareHeart className="size-4" /> Give feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-strong border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareHeart className="size-5 text-[--primary]" /> Share your feedback
          </DialogTitle>
          <DialogDescription>
            Found a bug? Want a new feature? Tell us — we ship the best ideas weekly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">How is your experience?</label>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={cn(
                    "size-9 rounded-xl grid place-items-center transition-all",
                    n <= rating
                      ? "[background:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] scale-110"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                  aria-label={`${n} stars`}
                >
                  <Star className={cn("size-4", n <= rating && "fill-current")} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as "bug" | "feature" | "general")}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">💬 General</SelectItem>
                <SelectItem value="bug">🐞 Bug report</SelectItem>
                <SelectItem value="feature">✨ Feature request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What's on your mind?"
              className="mt-1.5 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={submitting || !message.trim()}>
            <Send className="size-4" /> {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}