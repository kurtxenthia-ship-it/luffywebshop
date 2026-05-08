import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, User, AtSign, FileText, Shield, Star, Loader2, Copy, CheckCircle2 } from "lucide-react";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface TgResult {
  found: boolean;
  error?: string;
  coinsSpent?: number;
  remainingBalance?: number;
  data?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    bio: string | null;
    type: string;
    isPremium: boolean;
    isVerified: boolean;
    photoUrl: string | null;
    phoneNote: string;
    nameHistoryNote: string;
  };
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded-md hover:bg-white/5 transition-colors">
      {copied ? <CheckCircle2 size={13} className="text-green-400" /> : <Copy size={13} className="text-muted-foreground" />}
    </button>
  );
}

function DataRow({ label, value, icon: Icon, iconColor, copyable }: {
  label: string; value: string; icon: React.ElementType; iconColor: string; copyable?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}>
        <Icon size={12} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground break-all">
          {value}
          {copyable && value !== "—" && <CopyBtn value={value} />}
        </div>
      </div>
    </div>
  );
}

export default function TgPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [inputId, setInputId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TgResult | null>(null);

  const handleLookup = async () => {
    const id = inputId.trim();
    if (!id || !/^\d+$/.test(id)) {
      toast({ title: "Invalid ID", description: "Enter a numeric Telegram user ID.", variant: "destructive" });
      return;
    }
    if (!user || user.balance < 5) {
      toast({ title: "Insufficient coins", description: "Need 5 coins to perform a lookup.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/api/tg/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json() as TgResult;
      setResult(data);
      if (data.remainingBalance !== undefined && user) {
        setUser({ ...user, balance: data.remainingBalance });
      }
      if (!data.found) {
        toast({ title: "Not found", description: data.error ?? "User not found.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const d = result?.data;
  const fullName = [d?.firstName, d?.lastName].filter(Boolean).join(" ") || "—";

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            <span style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              TG Account Lookup
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Look up a Telegram account by user ID — name, username, bio &amp; more</p>
        </div>

        {/* Input card */}
        <div className="rounded-2xl p-5 border space-y-4"
          style={{ background: "hsl(262,38%,6%)", borderColor: "hsl(268,32%,14%)" }}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telegram User ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 6909792649"
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="pl-10 h-12 font-mono text-sm rounded-xl"
                  style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}
                  data-testid="input-tg-id"
                />
              </div>
              <Button
                onClick={handleLookup}
                disabled={loading || !inputId || !user}
                className="h-12 px-5 font-bold rounded-xl text-white"
                style={{
                  background: "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)",
                  boxShadow: "0 0 16px rgba(139,92,246,0.3)",
                }}
                data-testid="button-lookup"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter the numeric Telegram ID (not a username)</p>
          </div>

          {/* Cost + balance */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
            <span className="text-xs text-muted-foreground">Cost per lookup</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CoinIcon size={13} />
                <span className="text-sm font-black text-violet-300">5 coins</span>
              </div>
              <div className="w-px h-4" style={{ background: "rgba(139,92,246,0.2)" }} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Balance:</span>
                <CoinIcon size={13} />
                <span className="text-sm font-bold">{user?.balance ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {result?.found && d && (
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "rgba(139,92,246,0.3)", background: "hsl(262,38%,6%)" }}>
            {/* Profile header */}
            <div className="p-5 border-b flex items-center gap-4"
              style={{
                borderColor: "rgba(139,92,246,0.15)",
                background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.06) 100%)",
              }}>
              {d.photoUrl ? (
                <img src={d.photoUrl} alt="profile" className="w-14 h-14 rounded-2xl object-cover border border-violet-500/30" />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(271,85%,50%) 0%, hsl(215,85%,50%) 100%)" }}>
                  <User size={22} className="text-white" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-black text-foreground">{fullName}</span>
                  {d.isPremium && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(245,158,11,0.15)", color: "hsl(45,90%,65%)", border: "1px solid rgba(245,158,11,0.25)" }}>
                      ⭐ Premium
                    </span>
                  )}
                  {d.isVerified && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(59,130,246,0.15)", color: "hsl(215,85%,70%)", border: "1px solid rgba(59,130,246,0.25)" }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
                {d.username && <div className="text-sm font-mono mt-0.5" style={{ color: "hsl(271,70%,72%)" }}>{d.username}</div>}
                <div className="text-xs text-muted-foreground mt-1">ID: {d.id}</div>
              </div>
            </div>

            {/* Data rows */}
            <div className="p-5 space-y-0">
              <DataRow label="First Name" value={d.firstName ?? "—"} icon={User} iconColor="hsl(271,85%,65%)" copyable />
              <DataRow label="Last Name" value={d.lastName ?? "—"} icon={User} iconColor="hsl(215,85%,62%)" copyable />
              <DataRow label="Username" value={d.username ?? "—"} icon={AtSign} iconColor="hsl(271,85%,65%)" copyable />
              <DataRow label="User ID" value={String(d.id)} icon={Shield} iconColor="hsl(45,90%,60%)" copyable />
              <DataRow label="Bio" value={d.bio ?? "—"} icon={FileText} iconColor="hsl(175,65%,52%)" />
              <DataRow
                label="Phone Number"
                value="🔒 Private — not disclosed by Telegram API"
                icon={Shield}
                iconColor="hsl(0,70%,55%)"
              />
              <DataRow
                label="Name History"
                value="Not available through official Telegram Bot API"
                icon={FileText}
                iconColor="hsl(265,25%,55%)"
              />
            </div>

            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
                <span className="text-xs text-green-400">Lookup complete — <strong>{result.coinsSpent}</strong> coins spent</span>
              </div>
            </div>
          </div>
        )}

        {result && !result.found && (
          <div className="rounded-2xl border p-5 text-center"
            style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
            <div className="text-red-400 font-bold mb-1">User Not Found</div>
            <p className="text-sm text-muted-foreground">{result.error}</p>
            <p className="text-xs text-muted-foreground mt-2 opacity-70">No coins were deducted.</p>
          </div>
        )}

        {/* Info note */}
        <div className="rounded-2xl border p-4"
          style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.12)" }}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground/70">Note:</strong> This lookup uses the official Telegram Bot API.
            The user must have previously interacted with a Telegram bot for their profile to be retrievable.
            Phone numbers and name history are private by Telegram's policy and are never exposed via the API.
          </p>
        </div>
      </div>
    </Layout>
  );
}
