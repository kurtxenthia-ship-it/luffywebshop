import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, CheckCircle2, Loader2, Star } from "lucide-react";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const PLACEHOLDERS = [
  "The site is amazing, keep it up!",
  "Found a bug on the CODM page...",
  "Can you add more SMS services?",
  "TXT generator works perfectly!",
];

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.username ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const ratingText = rating > 0 ? `\n⭐ Rating: ${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)` : "";
      const res = await fetch(`${BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), message: message.trim() + ratingText }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        toast({ title: "Failed", description: data.error ?? "Could not send feedback.", variant: "destructive" });
        return;
      }
      setSent(true);
      toast({ title: "Feedback sent!", description: "Thank you — the developer will review your message." });
    } catch {
      toast({ title: "Network error", description: "Try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-black">Feedback Sent!</h2>
          <p className="text-sm text-muted-foreground">
            Your message has been delivered to the developer. Thank you for taking the time to share your thoughts.
          </p>
          <Button
            onClick={() => { setSent(false); setMessage(""); setRating(0); }}
            variant="outline"
            className="rounded-xl mt-4"
          >
            Send Another
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            <span style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Feedback
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Share your thoughts, report bugs, or suggest new features</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl p-5 border space-y-4"
            style={{ background: "hsl(262,38%,6%)", borderColor: "hsl(268,32%,14%)" }}>
            {/* Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rate the site (optional)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s === rating ? 0 : s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-all hover:scale-110"
                    style={{ filter: s <= (hoverRating || rating) ? "none" : "grayscale(1) opacity(0.3)" }}
                  >
                    ⭐
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-xs font-bold" style={{ color: "hsl(45,90%,65%)" }}>
                    {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Juan dela Cruz"
                maxLength={100}
                className="h-11 rounded-xl text-sm"
                style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}
                data-testid="input-feedback-name"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]}
                maxLength={2000}
                rows={5}
                className="resize-none rounded-xl text-sm"
                style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}
                data-testid="textarea-feedback-message"
              />
              <div className="text-right text-xs text-muted-foreground">{message.length}/2000</div>
            </div>

            <Button
              type="submit"
              disabled={loading || !name.trim() || !message.trim()}
              className="w-full h-11 font-black tracking-wide rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)",
                boxShadow: "0 0 20px rgba(139,92,246,0.3)",
              }}
              data-testid="button-send-feedback"
            >
              {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Sending...</> : <><Send size={14} className="mr-2" />Send Feedback</>}
            </Button>
          </div>
        </form>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.12)" }}>
          <MessageCircle size={15} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your feedback is sent directly to the developer{" "}
            <a href="https://t.me/cozybalenciaga" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 font-semibold">@cozybalenciaga</a>{" "}
            via Telegram. Responses may take a few hours.
          </p>
        </div>
      </div>
    </Layout>
  );
}
