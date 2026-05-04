import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useGenerateCodmAccount, useListCodmAccounts, getListCodmAccountsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Loader2, Copy, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

const COUNT_OPTIONS = [1, 3, 5];

export default function CodmPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(1);

  const { data: accounts } = useListCodmAccounts({
    query: { queryKey: getListCodmAccountsQueryKey() },
  });

  const generateMutation = useGenerateCodmAccount();

  const accountsList = (accounts as Array<{ id: number; account: string; status: string; coinsSpent: number; createdAt: string }> | undefined) ?? [];
  const coinsRequired = count * 10;

  const handleGenerate = () => {
    generateMutation.mutate(
      { data: { count } },
      {
        onSuccess: (res) => {
          const data = res as { id: number; account: string; status: string; coinsSpent: number; createdAt: string };
          queryClient.invalidateQueries({ queryKey: getListCodmAccountsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          if (user) {
            setUser({ ...user, balance: user.balance - data.coinsSpent });
          }
          toast({ title: "Account Generated!", description: `Status: ${data.status}` });
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to generate";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const copyAccount = (account: string) => {
    navigator.clipboard.writeText(account);
    toast({ title: "Copied!", description: "Account copied to clipboard." });
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "working") return <CheckCircle2 size={14} className="text-green-500" />;
    if (status === "not_working") return <XCircle size={14} className="text-red-500" />;
    return <HelpCircle size={14} className="text-yellow-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === "working") return "Working";
    if (status === "not_working") return "Not Working";
    return "Unknown";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">CODM Account Generator</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate Call of Duty Mobile accounts</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <CoinIcon size={18} />
            <span className="font-bold text-sm">{user?.balance ?? 0}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Generator panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Gamepad2 size={14} />
                Generate Accounts
              </h3>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">How many accounts?</p>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all
                        ${count === n ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                      data-testid={`button-count-${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cost</span>
                  <div className="flex items-center gap-1.5">
                    <CoinIcon size={14} />
                    <span className="text-sm font-bold">{coinsRequired} coins</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">After generation</span>
                  <span className="text-xs font-semibold text-foreground">{(user?.balance ?? 0) - coinsRequired} coins remaining</span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || (user?.balance ?? 0) < coinsRequired}
                className="w-full h-11 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                data-testid="button-generate-codm"
              >
                {generateMutation.isPending ? (
                  <><Loader2 size={14} className="animate-spin mr-2" />Generating...</>
                ) : (
                  <><Gamepad2 size={14} className="mr-2" />Generate {count} Account{count > 1 ? "s" : ""}</>
                )}
              </Button>

              {(user?.balance ?? 0) < coinsRequired && (
                <p className="text-xs text-center text-red-500 mt-2">Insufficient coins. Add balance first.</p>
              )}
            </div>

            <div className="bg-accent/20 border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Pricing</p>
              <p className="text-xs text-muted-foreground">1 account = <span className="text-primary font-bold">10 coins</span></p>
              <p className="text-xs text-muted-foreground mt-1">Note: Some accounts may be working or not. Results vary.</p>
            </div>
          </div>

          {/* Accounts history */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Generated Accounts</h3>
            {accountsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Gamepad2 size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No accounts generated yet</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-auto max-h-[500px]">
                {accountsList.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2.5 border border-border/50"
                    data-testid={`account-item-${acc.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon status={acc.status} />
                      <span className="font-mono text-xs text-foreground/80 truncate">{acc.account}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-semibold ${
                        acc.status === "working" ? "text-green-500" :
                        acc.status === "not_working" ? "text-red-400" : "text-yellow-500"
                      }`}>
                        {statusLabel(acc.status)}
                      </span>
                      <button
                        onClick={() => copyAccount(acc.account)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`button-copy-account-${acc.id}`}
                      >
                        <Copy size={13} />
                      </button>
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
