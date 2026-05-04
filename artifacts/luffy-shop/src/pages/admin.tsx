import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import {
  useGetAdminStats, useGetRecentLogins, useListPendingTopups, useListUsers,
  useApproveTopup, useUpdateUserBalance, useUploadTxtFile,
  getGetAdminStatsQueryKey, getGetRecentLoginsQueryKey, getListPendingTopupsQueryKey, getListUsersQueryKey, getListTxtFilesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Zap, Gamepad2, CreditCard, ShieldCheck,
  Clock, CheckCircle2, Upload, Loader2, Settings
} from "lucide-react";

const uploadFileSchema = z.object({
  name: z.string().min(1, "File name required"),
  content: z.string().min(1, "Content required"),
});

const balanceSchema = z.object({
  balance: z.coerce.number().min(0, "Balance must be non-negative"),
});

type UploadFileForm = z.infer<typeof uploadFileSchema>;
type BalanceForm = z.infer<typeof balanceSchema>;

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5" data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div className="text-3xl font-black text-foreground">{value}</div>
    </div>
  );
}

function UserBalanceRow({ user, onSuccess }: { user: { id: number; userId: string; username: string; email: string; balance: number }; onSuccess: () => void }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const updateBalance = useUpdateUserBalance();
  const form = useForm<BalanceForm>({
    resolver: zodResolver(balanceSchema),
    defaultValues: { balance: user.balance },
  });

  const onSubmit = (data: BalanceForm) => {
    updateBalance.mutate({ id: user.id, data }, {
      onSuccess: () => {
        toast({ title: "Balance updated", description: `${user.username}'s balance set to ${data.balance} coins.` });
        setEditing(false);
        onSuccess();
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not update balance.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="bg-secondary/20 rounded-lg p-3 border border-border/50" data-testid={`user-row-${user.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{user.username}</span>
            <span className="font-mono text-xs text-primary">{user.userId}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <CoinIcon size={12} />
            <span className="text-xs font-bold">{user.balance} coins</span>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mt-0.5"
          data-testid={`button-edit-balance-${user.id}`}
        >
          <Settings size={14} />
        </button>
      </div>
      {editing && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        className="h-8 text-sm bg-background"
                        data-testid={`input-balance-${user.id}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90 text-xs"
                disabled={updateBalance.isPending}
                data-testid={`button-save-balance-${user.id}`}
              >
                {updateBalance.isPending ? <Loader2 size={12} className="animate-spin" /> : "Save"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: recentLogins } = useGetRecentLogins({ query: { queryKey: getGetRecentLoginsQueryKey() } });
  const { data: pendingTopups } = useListPendingTopups({ query: { queryKey: getListPendingTopupsQueryKey() } });
  const { data: users } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });

  const approveTopup = useApproveTopup();
  const uploadFile = useUploadTxtFile();

  const adminStats = stats as { totalUsers: number; totalCoinsDistributed: number; totalGenerations: number; pendingTopups: number; totalRevenue: number; totalCodmGenerated: number } | undefined;
  const loginsList = (recentLogins as Array<{ id: number; userId: number; username: string; email: string; loginAt: string }> | undefined) ?? [];
  const topupsList = (pendingTopups as Array<{ id: number; userId: number; amount: number; reference: string | null; createdAt: string; user: { username: string; userId: string } }> | undefined) ?? [];
  const usersList = (users as Array<{ id: number; userId: string; username: string; email: string; balance: number }> | undefined) ?? [];

  const fileForm = useForm<UploadFileForm>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: { name: "", content: "" },
  });

  const handleApprove = (id: number) => {
    approveTopup.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPendingTopupsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Topup approved!", description: "Coins added to user balance." });
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not approve topup.", variant: "destructive" });
      },
    });
  };

  const handleUpload = (data: UploadFileForm) => {
    uploadFile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTxtFilesQueryKey() });
        fileForm.reset();
        toast({ title: "File uploaded!", description: "TXT file is now available for generation." });
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not upload file.", variant: "destructive" });
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage users, topups, and content</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={adminStats?.totalUsers ?? 0} icon={Users} />
          <StatCard label="Coins Distributed" value={adminStats?.totalCoinsDistributed ?? 0} icon={CoinIcon} />
          <StatCard label="Generations" value={adminStats?.totalGenerations ?? 0} icon={Zap} />
          <StatCard label="Pending Topups" value={adminStats?.pendingTopups ?? 0} icon={CreditCard} />
          <StatCard label="Total Revenue" value={`₱${adminStats?.totalRevenue ?? 0}`} icon={CreditCard} />
          <StatCard label="CODM Generated" value={adminStats?.totalCodmGenerated ?? 0} icon={Gamepad2} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pending topups */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <CreditCard size={14} />
              Pending Topups ({topupsList.length})
            </h3>
            {topupsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending topups</p>
            ) : (
              <div className="space-y-2">
                {topupsList.map((tx) => (
                  <div key={tx.id} className="bg-secondary/20 rounded-lg p-3 border border-border/50 flex items-center justify-between gap-3" data-testid={`pending-topup-${tx.id}`}>
                    <div>
                      <div className="text-sm font-semibold">{tx.user?.username ?? "User"} <span className="text-xs font-mono text-primary">{tx.user?.userId}</span></div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CoinIcon size={12} />
                        <span className="text-sm font-bold">{tx.amount} coins</span>
                      </div>
                      {tx.reference && <p className="text-xs text-muted-foreground font-mono">Ref: {tx.reference}</p>}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(tx.id)}
                      disabled={approveTopup.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs flex-shrink-0"
                      data-testid={`button-approve-topup-${tx.id}`}
                    >
                      <CheckCircle2 size={12} className="mr-1" /> Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent logins */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Clock size={14} />
              Recent Logins
            </h3>
            {loginsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent logins</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-auto">
                {loginsList.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0" data-testid={`login-event-${event.id}`}>
                    <div>
                      <div className="text-sm font-semibold">{event.username}</div>
                      <div className="text-xs text-muted-foreground">{event.email}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.loginAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload TXT file */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Upload size={14} />
              Upload TXT File
            </h3>
            <Form {...fileForm}>
              <form onSubmit={fileForm.handleSubmit(handleUpload)} className="space-y-4">
                <FormField
                  control={fileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Premium Accounts Dec 2025"
                          className="bg-secondary/50 h-10 text-sm"
                          data-testid="input-file-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fileForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content (one line per entry)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={"username1:password1\nusername2:password2\n..."}
                          rows={8}
                          className="bg-secondary/50 text-sm font-mono resize-none"
                          data-testid="textarea-file-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-10 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                  disabled={uploadFile.isPending}
                  data-testid="button-upload-file"
                >
                  {uploadFile.isPending ? (
                    <><Loader2 size={14} className="animate-spin mr-2" />Uploading...</>
                  ) : (
                    <><Upload size={14} className="mr-2" />Upload File</>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Users list */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Users size={14} />
              All Users ({usersList.length})
            </h3>
            {usersList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No users registered</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {usersList.map((u) => (
                  <UserBalanceRow
                    key={u.id}
                    user={u}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
                      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
