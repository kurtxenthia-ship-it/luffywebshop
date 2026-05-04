import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useRequestTopup, useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2, Send, Clock, CheckCircle2 } from "lucide-react";

const topupSchema = z.object({
  amount: z.coerce.number().min(50, "Minimum topup is 50 coins"),
  reference: z.string().min(4, "Enter valid GCash reference number"),
});

type TopupForm = z.infer<typeof topupSchema>;

const GCASH_NUMBER = "0917-XXX-XXXX"; // Placeholder

export default function TopupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const topupMutation = useRequestTopup();

  const { data: transactions } = useListTransactions({
    query: { queryKey: getListTransactionsQueryKey() },
  });

  const topups = (transactions as Array<{ id: number; type: string; amount: number; status: string; reference: string | null; note: string | null; createdAt: string }> | undefined)
    ?.filter(tx => tx.type === "topup") ?? [];

  const form = useForm<TopupForm>({
    resolver: zodResolver(topupSchema),
    defaultValues: { amount: 50, reference: "" },
  });

  const onSubmit = (data: TopupForm) => {
    topupMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        form.reset();
        toast({
          title: "Request submitted!",
          description: "Admin will review and approve your topup shortly.",
        });
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not submit topup request.", variant: "destructive" });
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Add Balance</h1>
            <p className="text-muted-foreground text-sm mt-1">Top up your coin balance via GCash</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <CoinIcon size={18} />
            <span className="font-bold text-sm">{user?.balance ?? 0}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Instructions + form */}
          <div className="space-y-4">
            {/* GCash instructions */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Send size={14} />
                Payment Instructions
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", text: `Send GCash to ${GCASH_NUMBER}` },
                  { step: "2", text: "Enter the amount you sent" },
                  { step: "3", text: "Enter your GCash reference number" },
                  { step: "4", text: "Submit and wait for admin approval" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-sm text-muted-foreground pt-0.5">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-semibold">GCash Number</p>
                <p className="text-lg font-mono font-black text-primary mt-1">{GCASH_NUMBER}</p>
                <p className="text-xs text-muted-foreground mt-1">1 PHP = 1 coin (minimum 50 coins)</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CreditCard size={14} />
                Submit Request
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (coins)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={50}
                            className="bg-secondary/50 h-10 text-sm"
                            data-testid="input-topup-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GCash Reference Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. 1234567890"
                            className="bg-secondary/50 h-10 text-sm font-mono"
                            data-testid="input-topup-reference"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                    disabled={topupMutation.isPending}
                    data-testid="button-submit-topup"
                  >
                    {topupMutation.isPending ? (
                      <><Loader2 size={14} className="animate-spin mr-2" />Submitting...</>
                    ) : (
                      <><Send size={14} className="mr-2" />Submit Request</>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Topup history */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Clock size={14} />
              Topup History
            </h3>
            {topups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CreditCard size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No topup requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topups.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-secondary/20 rounded-lg p-3 border border-border/50"
                    data-testid={`topup-item-${tx.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CoinIcon size={16} />
                        <span className="text-sm font-bold">{tx.amount} coins</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        tx.status === "approved"
                          ? "bg-green-500/15 text-green-500"
                          : tx.status === "pending"
                          ? "bg-yellow-500/15 text-yellow-500"
                          : "bg-red-500/15 text-red-500"
                      }`}>
                        {tx.status === "approved" && <CheckCircle2 size={10} className="inline mr-1" />}
                        {tx.status}
                      </span>
                    </div>
                    {tx.reference && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">Ref: {tx.reference}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
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
