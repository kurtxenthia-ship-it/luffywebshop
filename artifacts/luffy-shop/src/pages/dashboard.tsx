import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useListTransactions, useListGenerationHistory, getListTransactionsQueryKey, getListGenerationHistoryQueryKey } from "@workspace/api-client-react";
import { Zap, Gamepad2, CreditCard, Clock, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: transactions } = useListTransactions({
    query: { queryKey: getListTransactionsQueryKey() },
  });

  const { data: genHistory } = useListGenerationHistory({
    query: { queryKey: getListGenerationHistoryQueryKey() },
  });

  const recentTransactions = (transactions as Array<{ id: number; type: string; amount: number; status: string; note: string | null; createdAt: string }> | undefined)?.slice(0, 5) ?? [];
  const recentGens = (genHistory as Array<{ id: number; fileName: string; lineCount: number; coinsSpent: number; createdAt: string }> | undefined)?.slice(0, 5) ?? [];

  const copyUserId = () => {
    if (user?.userId) {
      navigator.clipboard.writeText(user.userId);
      toast({ title: "Copied!", description: "User ID copied to clipboard." });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, <span className="text-foreground font-semibold">{user?.username}</span></p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Balance card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-md col-span-1" data-testid="card-balance">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coin Balance</span>
              <CoinIcon size={20} />
            </div>
            <div className="text-4xl font-black text-foreground">{user?.balance ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">coins available</div>
          </div>

          {/* User ID card */}
          <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-md shadow-primary/5 col-span-1" data-testid="card-user-id">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your User ID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-lg font-bold text-primary tracking-wider">{user?.userId}</div>
              <button onClick={copyUserId} className="text-muted-foreground hover:text-primary transition-colors" data-testid="button-copy-userid">
                <Copy size={14} />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Share this to receive coins from admin</div>
          </div>

          {/* Total generations */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-md col-span-1" data-testid="card-generations">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Generates</span>
              <Zap size={16} className="text-muted-foreground" />
            </div>
            <div className="text-4xl font-black text-foreground">{(genHistory as unknown[])?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">lifetime generations</div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/generator" className="flex items-center gap-3 bg-card hover:bg-accent/30 border border-border hover:border-primary/30 rounded-xl p-4 transition-all group" data-testid="link-quick-generator">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Zap size={16} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">TXT Generator</div>
                <div className="text-xs text-muted-foreground">20–80 coins</div>
              </div>
            </Link>
            <Link href="/codm" className="flex items-center gap-3 bg-card hover:bg-accent/30 border border-border hover:border-primary/30 rounded-xl p-4 transition-all group" data-testid="link-quick-codm">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Gamepad2 size={16} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">CODM Accounts</div>
                <div className="text-xs text-muted-foreground">10 coins each</div>
              </div>
            </Link>
            <Link href="/topup" className="flex items-center gap-3 bg-card hover:bg-accent/30 border border-border hover:border-primary/30 rounded-xl p-4 transition-all group" data-testid="link-quick-topup">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <CreditCard size={16} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Add Balance</div>
                <div className="text-xs text-muted-foreground">Via GCash</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent transactions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Recent Transactions</h3>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`tx-item-${tx.id}`}>
                    <div>
                      <div className="text-xs font-semibold capitalize">{tx.type}</div>
                      <div className="text-xs text-muted-foreground">{tx.note ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${tx.type === "topup" ? "text-green-500" : "text-primary"}`}>
                        {tx.type === "topup" ? "+" : "-"}{tx.amount}
                      </div>
                      <div className={`text-xs ${tx.status === "pending" ? "text-yellow-500" : tx.status === "approved" ? "text-green-500" : "text-muted-foreground"}`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent generations */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Recent Generations</h3>
            {recentGens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No generations yet</p>
            ) : (
              <div className="space-y-2">
                {recentGens.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`gen-item-${gen.id}`}>
                    <div>
                      <div className="text-xs font-semibold">{gen.fileName}</div>
                      <div className="text-xs text-muted-foreground">{gen.lineCount} lines</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CoinIcon size={12} />
                      <span>{gen.coinsSpent}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
