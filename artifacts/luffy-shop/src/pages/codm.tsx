import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useListCodmAccounts, getListCodmAccountsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Loader2, Copy, CheckCircle2, ShieldAlert, ShieldCheck, Globe, Hash, Trophy, User, Lock } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL ?? "/";

const CODM_PACKAGES = [
  { count: 1, coins: 50, label: "BASIC", desc: "1 Account", color: "hsl(215,85%,55%)" },
  { count: 2, coins: 80, label: "DOUBLE", desc: "2 Accounts", color: "hsl(0,85%,50%)" },
  { count: 3, coins: 120, label: "TRIPLE", desc: "3 Accounts", color: "hsl(30,90%,55%)" },
];

interface ClaimedAccount {
  username: string;
  password: string;
  nickname: string | null;
  uid: string | null;
  level: number | null;
  region: string | null;
  status: string;
}

interface HistoryAccount {
  id: number;
  account: string;
  parsed: ClaimedAccount | null;
  status: string;
  coinsSpent: number;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  const isClean = s.includes("clean") && !s.includes("not");
  const isNotClean = s.includes("not clean") || s.includes("not_clean");

  if (isClean && !isNotClean) {
    return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400"><ShieldCheck size={10} />CLEAN</span>;
  }
  if (isNotClean) {
    return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400"><ShieldAlert size={10} />NOT CLEAN</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{status}</span>;
}

function AccountCard({ acc }: { acc: ClaimedAccount }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyField = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(220,38,38,0.04) 100%)" }}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 size={14} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CODM Account</span>
        </div>
        <StatusBadge status={acc.status} />
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <User size={10} />Username
            </div>
            <button
              onClick={() => copyField(acc.username, "user")}
              className="w-full flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2 hover:bg-secondary/60 transition-colors group"
            >
              <span className="font-mono text-sm font-bold truncate">{acc.username}</span>
              {copied === "user" ? <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" /> : <Copy size={11} className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <Lock size={10} />Password
            </div>
            <button
              onClick={() => copyField(acc.password, "pass")}
              className="w-full flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2 hover:bg-secondary/60 transition-colors group"
            >
              <span className="font-mono text-sm font-bold truncate">{acc.password}</span>
              {copied === "pass" ? <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" /> : <Copy size={11} className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          </div>
        </div>
        {(acc.nickname || acc.uid || acc.level || acc.region) && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
            {acc.nickname && (
              <div className="flex items-center gap-1.5 text-xs">
                <User size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground">Nick:</span>
                <span className="font-semibold truncate">{acc.nickname}</span>
              </div>
            )}
            {acc.uid && (
              <div className="flex items-center gap-1.5 text-xs">
                <Hash size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground">UID:</span>
                <span className="font-mono text-xs truncate">{acc.uid}</span>
              </div>
            )}
            {acc.level && (
              <div className="flex items-center gap-1.5 text-xs">
                <Trophy size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground">Level:</span>
                <span className="font-bold text-primary">{acc.level}</span>
              </div>
            )}
            {acc.region && (
              <div className="flex items-center gap-1.5 text-xs">
                <Globe size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground">Region:</span>
                <span className="font-bold">{acc.region}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CodmPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [lastClaimed, setLastClaimed] = useState<ClaimedAccount[] | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useListCodmAccounts({
    query: { queryKey: getListCodmAccountsQueryKey() },
  });

  const accountsList = (accounts as HistoryAccount[] | undefined) ?? [];

  const apiBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

  const handleClaim = async () => {
    if (!selectedPackage || !user) return;
    const pkg = CODM_PACKAGES.find(p => p.count === selectedPackage);
    if (!pkg) return;

    if (user.balance < pkg.coins) {
      toast({ title: "Insufficient coins", description: `Need ${pkg.coins} coins. You have ${user.balance}.`, variant: "destructive" });
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch(`${apiBase}/api/codm/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packageSize: selectedPackage }),
      });

      const data = await res.json() as { accounts?: ClaimedAccount[]; coinsSpent?: number; remainingBalance?: number; error?: string };

      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to claim accounts.", variant: "destructive" });
        return;
      }

      setLastClaimed(data.accounts ?? []);
      if (user && data.remainingBalance !== undefined) {
        setUser({ ...user, balance: data.remainingBalance });
      }
      queryClient.invalidateQueries({ queryKey: getListCodmAccountsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Accounts Claimed!", description: `${data.accounts?.length} account(s) claimed. ${data.coinsSpent} coins spent.` });
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span style={{ background: "linear-gradient(135deg, hsl(215,85%,62%) 0%, hsl(0,85%,62%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                CODM Accounts
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Claim real Call of Duty Mobile accounts</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
            <CoinIcon size={17} />
            <span className="font-black text-sm">{user?.balance ?? 0}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Package selector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Gamepad2 size={13} />
                Choose Package
              </h3>
              <div className="space-y-3">
                {CODM_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage === pkg.count;
                  return (
                    <button
                      key={pkg.count}
                      onClick={() => setSelectedPackage(pkg.count)}
                      className="w-full p-4 rounded-xl border text-left transition-all duration-200"
                      style={isSelected ? {
                        borderColor: pkg.color,
                        background: `linear-gradient(135deg, ${pkg.color}12 0%, ${pkg.color}06 100%)`,
                        boxShadow: `0 0 16px ${pkg.color}20`,
                      } : { borderColor: "hsl(var(--border))" }}
                      data-testid={`button-package-${pkg.count}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black" style={isSelected ? { color: pkg.color } : {}}>{pkg.label}</span>
                        <div className="flex items-center gap-1">
                          <CoinIcon size={14} />
                          <span className="text-sm font-black">{pkg.coins}</span>
                          <span className="text-xs text-muted-foreground">coins</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{pkg.desc}</div>
                      {user && (
                        <div className="text-xs mt-1" style={{ color: user.balance >= pkg.coins ? "hsl(150,60%,45%)" : "hsl(0,70%,50%)" }}>
                          {user.balance >= pkg.coins ? `After: ${user.balance - pkg.coins} coins` : "Insufficient coins"}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleClaim}
                disabled={!selectedPackage || claiming || !user || (user.balance < (CODM_PACKAGES.find(p => p.count === selectedPackage)?.coins ?? 999))}
                className="w-full h-11 font-bold rounded-xl mt-4 shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg, hsl(0,85%,48%) 0%, hsl(0,85%,40%) 100%)", boxShadow: "0 0 16px rgba(220,38,38,0.3)" }}
                data-testid="button-claim-codm"
              >
                {claiming ? (
                  <><Loader2 size={14} className="animate-spin mr-2" />Claiming...</>
                ) : (
                  <><Gamepad2 size={14} className="mr-2" />Claim Accounts</>
                )}
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4" style={{ borderColor: "rgba(59,130,246,0.2)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">How It Works</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> Choose a package based on your needs</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> Accounts are real — uploaded by admin</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> Each account shows full credentials</li>
                <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> Click fields to copy instantly</li>
              </ul>
            </div>
          </div>

          {/* Results + history */}
          <div className="lg:col-span-3 space-y-4">
            {/* Latest claimed */}
            {lastClaimed && lastClaimed.length > 0 && (
              <div className="bg-card border rounded-2xl p-5" style={{ borderColor: "rgba(59,130,246,0.3)", boxShadow: "0 0 20px rgba(59,130,246,0.08)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "hsl(215,85%,62%)" }}>
                  <CheckCircle2 size={13} />
                  Just Claimed
                </h3>
                <div className="space-y-3">
                  {lastClaimed.map((acc, i) => (
                    <AccountCard key={i} acc={acc} />
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Claimed History</h3>
              {accountsLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </div>
              ) : accountsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Gamepad2 size={28} className="mb-2 opacity-20" />
                  <p className="text-sm">No accounts claimed yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-auto pr-1">
                  {accountsList.map((acc) => (
                    acc.parsed
                      ? <AccountCard key={acc.id} acc={acc.parsed} />
                      : (
                        <div key={acc.id} className="bg-secondary/20 rounded-xl p-3 border border-border/50 font-mono text-xs">
                          {acc.account}
                        </div>
                      )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
