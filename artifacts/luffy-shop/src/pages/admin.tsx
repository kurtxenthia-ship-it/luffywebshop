import { useState, useEffect } from "react";
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
  Users, Zap, Gamepad2, ShieldCheck, Clock, CheckCircle2,
  Upload, Loader2, Settings, Ban, Package, RefreshCw, Shield, ChevronDown, ChevronRight
} from "lucide-react";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const uploadFileSchema = z.object({
  name: z.string().min(1, "File name required"),
  content: z.string().min(1, "Content required"),
});
const balanceSchema = z.object({
  balance: z.coerce.number().min(0, "Balance must be non-negative"),
});
type UploadFileForm = z.infer<typeof uploadFileSchema>;
type BalanceForm = z.infer<typeof balanceSchema>;

type TabKey = "stats" | "users" | "codm-pool" | "txt-files" | "pricing" | "checker";

function TabButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"}`}
      style={active ? { background: "linear-gradient(135deg, rgba(139,92,246,0.30) 0%, rgba(59,130,246,0.22) 100%)", border: "1px solid rgba(139,92,246,0.35)" } : {}}>
      <Icon size={14} />{label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon size={15} className="text-muted-foreground" />
      </div>
      <div className="text-3xl font-black" style={color ? { color } : {}}>{value}</div>
    </div>
  );
}

function UserRow({ user, onSuccess }: { user: { id: number; userId: string; username: string; email: string; balance: number; isBanned?: boolean }; onSuccess: () => void }) {
  const [editing, setEditing] = useState(false);
  const [banning, setBanning] = useState(false);
  const { toast } = useToast();
  const updateBalance = useUpdateUserBalance();
  const form = useForm<BalanceForm>({ resolver: zodResolver(balanceSchema), defaultValues: { balance: user.balance } });

  const onSubmitBalance = (data: BalanceForm) => {
    updateBalance.mutate({ id: user.id, data }, {
      onSuccess: () => { toast({ title: "Balance updated" }); setEditing(false); onSuccess(); },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const toggleBan = async () => {
    setBanning(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/${user.id}/ban`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ isBanned: !user.isBanned }) });
      if (res.ok) { toast({ title: user.isBanned ? "User unbanned" : "User banned" }); onSuccess(); }
      else toast({ title: "Failed", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setBanning(false); }
  };

  return (
    <div className={`rounded-xl p-3.5 border transition-all ${user.isBanned ? "border-red-500/30 bg-red-500/5" : "border-border/50 bg-secondary/15"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold truncate">{user.username}</span>
            <span className="font-mono text-xs" style={{ color: "hsl(215,85%,62%)" }}>{user.userId}</span>
            {user.isBanned && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">BANNED</span>}
          </div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <div className="flex items-center gap-1.5 mt-1"><CoinIcon size={12} /><span className="text-xs font-bold">{user.balance} coins</span></div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={toggleBan} disabled={banning}
            className={`p-1.5 rounded-lg transition-colors ${user.isBanned ? "bg-green-500/15 text-green-500 hover:bg-green-500/25" : "bg-red-500/15 text-red-400 hover:bg-red-500/25"}`}>
            {banning ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
          </button>
          <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg bg-accent/30 text-muted-foreground hover:text-primary hover:bg-accent/60 transition-colors">
            <Settings size={13} />
          </button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitBalance)} className="flex gap-2">
              <FormField control={form.control} name="balance" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl><Input {...field} type="number" min={0} className="h-9 text-sm bg-secondary/50 rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={updateBalance.isPending} className="h-9 px-4 rounded-xl text-xs font-bold">
                {updateBalance.isPending ? <Loader2 size={12} className="animate-spin" /> : "Save"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

interface CheckerJob {
  id: number; username: string; user_uid: string; filename: string;
  total_lines: number; coins_spent: number; status: string;
  results: Array<{ combo: string; status: string; details?: string }> | null;
  created_at: string;
}

function CheckerJobRow({ job }: { job: CheckerJob }) {
  const [expanded, setExpanded] = useState(false);
  const valid = job.results?.filter(r => r.status === "valid").length ?? 0;
  const invalid = job.results?.filter(r => r.status === "invalid").length ?? 0;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(268,32%,14%)" }}>
      <div className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">{job.username}</span>
            <span className="text-xs font-mono text-muted-foreground">{job.user_uid}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${job.status === "done" ? "bg-green-500/15 text-green-400" : job.status === "running" ? "bg-violet-500/15 text-violet-400" : "bg-yellow-500/15 text-yellow-400"}`}>
              {job.status.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{job.filename} · {job.total_lines} lines · <CoinIcon size={10} className="inline" /> {job.coins_spent} coins</div>
          {job.results && (
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-green-400 font-bold">{valid} valid</span>
              <span className="text-red-400 font-bold">{invalid} invalid</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>
      {expanded && job.results && (
        <div className="border-t p-3 max-h-64 overflow-auto font-mono text-xs space-y-0.5" style={{ borderColor: "hsl(268,32%,14%)", background: "hsl(260,45%,2%)" }}>
          {job.results.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`font-bold w-14 flex-shrink-0 ${r.status === "valid" ? "text-green-400" : r.status === "invalid" ? "text-red-400" : "text-yellow-400"}`}>
                [{r.status.toUpperCase()}]
              </span>
              <span className="text-foreground/70 truncate">{r.combo}</span>
              {r.details && <span className="text-muted-foreground/50 flex-shrink-0">({r.details})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("stats");
  const [uploadingCodm, setUploadingCodm] = useState(false);
  const [codmPoolContent, setCodmPoolContent] = useState("");
  const [poolStats, setPoolStats] = useState<{ total: number; claimed: number; available: number } | null>(null);
  const [loadingPoolStats, setLoadingPoolStats] = useState(false);
  const [pricingData, setPricingData] = useState<{ generator: Record<string, number>; codm: Record<string, number> } | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);
  const [checkerJobs, setCheckerJobs] = useState<CheckerJob[]>([]);
  const [loadingChecker, setLoadingChecker] = useState(false);

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: recentLogins } = useGetRecentLogins({ query: { queryKey: getGetRecentLoginsQueryKey() } });
  const { data: pendingTopups } = useListPendingTopups({ query: { queryKey: getListPendingTopupsQueryKey() } });
  const { data: users } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const approveTopup = useApproveTopup();
  const uploadTxtFile = useUploadTxtFile();

  const uploadFileForm = useForm<UploadFileForm>({ resolver: zodResolver(uploadFileSchema), defaultValues: { name: "", content: "" } });

  const statsData = stats as { totalUsers: number; totalCoinsDistributed: number; totalGenerations: number; pendingTopups: number; totalRevenue: number; totalCodmGenerated: number; codmPoolTotal?: number; codmPoolAvailable?: number } | undefined;
  const loginsList = (recentLogins as Array<{ id: number; userId: number; username: string; email: string; loginAt: string }> | undefined) ?? [];
  const pendingList = (pendingTopups as Array<{ id: number; userId: number; amount: number; status: string; reference: string | null; note: string | null; createdAt: string; user: { username: string; userId: string } }> | undefined) ?? [];
  const usersList = (users as Array<{ id: number; userId: string; username: string; email: string; balance: number; isBanned?: boolean }> | undefined) ?? [];

  const handleApproveTopup = (id: number) => {
    approveTopup.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPendingTopupsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Topup approved" });
      },
      onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
    });
  };

  const handleUploadCodmPool = async () => {
    if (!codmPoolContent.trim()) { toast({ title: "Error", description: "Paste content first.", variant: "destructive" }); return; }
    setUploadingCodm(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/codm-pool`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ content: codmPoolContent }) });
      const data = await res.json() as { inserted?: number; error?: string };
      if (res.ok) { toast({ title: "Uploaded!", description: `${data.inserted} accounts added.` }); setCodmPoolContent(""); loadCodmPoolStats(); }
      else toast({ title: "Upload failed", description: data.error, variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setUploadingCodm(false); }
  };

  const loadCodmPoolStats = async () => {
    setLoadingPoolStats(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/codm-pool/stats`, { credentials: "include" });
      if (res.ok) setPoolStats(await res.json() as { total: number; claimed: number; available: number });
    } catch {}
    setLoadingPoolStats(false);
  };

  const loadPricingConfig = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/config/pricing`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { generator_pricing: Record<string, number>; codm_pricing: Record<string, number> };
        setPricingData({ generator: data.generator_pricing, codm: data.codm_pricing });
      }
    } catch {}
  };

  const savePricing = async () => {
    if (!pricingData) return;
    setSavingPricing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/config/pricing`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ generator_pricing: pricingData.generator, codm_pricing: pricingData.codm }) });
      if (res.ok) toast({ title: "Pricing saved!" });
      else toast({ title: "Failed to save", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingPricing(false); }
  };

  const loadCheckerJobs = async () => {
    setLoadingChecker(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/checker-jobs`, { credentials: "include" });
      if (res.ok) setCheckerJobs(await res.json() as CheckerJob[]);
    } catch {}
    setLoadingChecker(false);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "codm-pool" && !poolStats) loadCodmPoolStats();
    if (tab === "pricing" && !pricingData) loadPricingConfig();
    if (tab === "checker") loadCheckerJobs();
  };

  const tabs: { id: TabKey; label: string; icon: React.ElementType }[] = [
    { id: "stats", label: "Stats", icon: ShieldCheck },
    { id: "users", label: "Users", icon: Users },
    { id: "codm-pool", label: "CODM Pool", icon: Gamepad2 },
    { id: "txt-files", label: "TXT Files", icon: Zap },
    { id: "checker", label: "Checker Jobs", icon: Shield },
    { id: "pricing", label: "Pricing", icon: Settings },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage COZY XO.SHOP</p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
          {tabs.map(tab => <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} icon={tab.icon} onClick={() => handleTabChange(tab.id)} />)}
        </div>

        {/* STATS */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={statsData?.totalUsers ?? 0} icon={Users} color="hsl(215,85%,62%)" />
              <StatCard label="Generations" value={statsData?.totalGenerations ?? 0} icon={Zap} color="hsl(271,85%,65%)" />
              <StatCard label="CODM Claimed" value={statsData?.totalCodmGenerated ?? 0} icon={Gamepad2} color="hsl(30,90%,55%)" />
              <StatCard label="Pending Topups" value={statsData?.pendingTopups ?? 0} icon={Clock} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard label="CODM Pool Total" value={statsData?.codmPoolTotal ?? 0} icon={Package} />
              <StatCard label="CODM Pool Available" value={statsData?.codmPoolAvailable ?? 0} icon={Package} color="hsl(150,60%,45%)" />
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Clock size={13} />Pending Top-up Requests</h3>
              {pendingList.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p> : (
                <div className="space-y-2">
                  {pendingList.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between bg-secondary/20 rounded-xl p-3.5 border border-border/50">
                      <div>
                        <div className="flex items-center gap-2"><span className="text-sm font-bold">{tx.user.username}</span><span className="font-mono text-xs text-muted-foreground">{tx.user.userId}</span></div>
                        <div className="flex items-center gap-1.5 mt-0.5"><CoinIcon size={13} /><span className="text-sm font-black">{tx.amount} coins</span></div>
                        {tx.reference && <div className="text-xs text-muted-foreground font-mono mt-0.5">Ref: {tx.reference}</div>}
                      </div>
                      <Button size="sm" onClick={() => handleApproveTopup(tx.id)} disabled={approveTopup.isPending}
                        className="rounded-xl font-bold text-xs"
                        style={{ background: "linear-gradient(135deg, hsl(150,65%,40%) 0%, hsl(150,65%,30%) 100%)" }}>
                        <CheckCircle2 size={13} className="mr-1" />Approve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Clock size={13} />Recent Logins</h3>
              <div className="space-y-1 max-h-64 overflow-auto">
                {loginsList.slice(0, 20).map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div><span className="text-sm font-semibold">{e.username}</span><span className="text-xs text-muted-foreground ml-2">{e.email}</span></div>
                    <span className="text-xs text-muted-foreground">{new Date(e.loginAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{usersList.length} total users</p>
            {usersList.map(user => <UserRow key={user.id} user={user} onSuccess={() => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })} />)}
          </div>
        )}

        {/* CODM POOL */}
        {activeTab === "codm-pool" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-2xl p-4 text-center"><div className="text-2xl font-black">{loadingPoolStats ? "..." : (poolStats?.total ?? 0)}</div><div className="text-xs text-muted-foreground mt-1">Total</div></div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}><div className="text-2xl font-black text-red-400">{loadingPoolStats ? "..." : (poolStats?.claimed ?? 0)}</div><div className="text-xs text-muted-foreground mt-1">Claimed</div></div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}><div className="text-2xl font-black text-violet-300">{loadingPoolStats ? "..." : (poolStats?.available ?? 0)}</div><div className="text-xs text-muted-foreground mt-1">Available</div></div>
            </div>
            <button onClick={loadCodmPoolStats} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><RefreshCw size={12} />Refresh stats</button>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Upload size={13} />Upload Accounts</h3>
              <Textarea value={codmPoolContent} onChange={(e) => setCodmPoolContent(e.target.value)}
                placeholder={"🎯 NEW HIT FOUND!\n━━━━━━━━━━━━━━━━━━━━\n👤 Username: example\n🔑 Password: example\n━━━━━━━━━━━━━━━━━━━━\n🎮 CODM Info\n   📛 Nickname: EXAMPLE\n   🆔 UID: 123456789\n   ⭐ Level: 100\n   🌏 Region: PH\n━━━━━━━━━━━━━━━━━━━━\n📊 Status: NOT CLEAN"}
                className="min-h-[200px] text-xs font-mono rounded-xl bg-secondary/30" />
              <Button onClick={handleUploadCodmPool} disabled={uploadingCodm || !codmPoolContent.trim()} className="mt-3 w-full h-10 font-bold rounded-xl"
                style={{ background: "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)" }}>
                {uploadingCodm ? <><Loader2 size={14} className="animate-spin mr-2" />Uploading...</> : <><Upload size={14} className="mr-2" />Add to Pool</>}
              </Button>
            </div>
          </div>
        )}

        {/* TXT FILES */}
        {activeTab === "txt-files" && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Upload size={13} />Upload TXT File</h3>
            <Form {...uploadFileForm}>
              <form onSubmit={uploadFileForm.handleSubmit((data) => uploadTxtFile.mutate({ data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTxtFilesQueryKey() }); uploadFileForm.reset(); toast({ title: "File uploaded" }); }, onError: () => toast({ title: "Upload failed", variant: "destructive" }) }))} className="space-y-4">
                <FormField control={uploadFileForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">File Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Premium Accounts" className="rounded-xl bg-secondary/40 h-10 text-sm" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={uploadFileForm.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content</FormLabel><FormControl><Textarea {...field} placeholder={"user1:pass1\nuser2:pass2"} className="min-h-[180px] rounded-xl bg-secondary/30 text-xs font-mono" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={uploadTxtFile.isPending} className="w-full h-10 font-bold rounded-xl"
                  style={{ background: "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)" }}>
                  {uploadTxtFile.isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Uploading...</> : <><Upload size={14} className="mr-2" />Upload File</>}
                </Button>
              </form>
            </Form>
          </div>
        )}

        {/* CHECKER JOBS */}
        {activeTab === "checker" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{checkerJobs.length} recent scan jobs</p>
              <button onClick={loadCheckerJobs} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {loadingChecker ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}Refresh
              </button>
            </div>
            {loadingChecker && checkerJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 size={20} className="animate-spin mx-auto mb-2" />Loading jobs...</div>
            ) : checkerJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Shield size={28} className="mx-auto mb-3 opacity-20" /><p className="text-sm">No checker jobs yet</p></div>
            ) : (
              <div className="space-y-2">
                {checkerJobs.map(job => <CheckerJobRow key={job.id} job={job} />)}
              </div>
            )}
          </div>
        )}

        {/* PRICING */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Zap size={13} />Generator Pricing</h3>
                {!pricingData && <button onClick={loadPricingConfig} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><RefreshCw size={11} />Load</button>}
              </div>
              {pricingData ? (
                <div className="space-y-3">
                  {Object.entries(pricingData.generator).map(([lines, coins]) => (
                    <div key={lines} className="flex items-center gap-3">
                      <div className="w-16 text-sm font-bold text-muted-foreground">{Number(lines).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">lines =</div>
                      <Input type="number" min={1} value={coins} onChange={(e) => setPricingData(prev => prev ? { ...prev, generator: { ...prev.generator, [lines]: parseInt(e.target.value) || 0 } } : null)} className="w-24 h-9 text-sm rounded-xl bg-secondary/40" />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><CoinIcon size={12} />coins</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Gamepad2 size={13} />CODM Pricing</h3>
              {pricingData ? (
                <div className="space-y-3">
                  {Object.entries(pricingData.codm).map(([count, coins]) => (
                    <div key={count} className="flex items-center gap-3">
                      <div className="w-16 text-sm font-bold text-muted-foreground">{count} acc</div>
                      <div className="text-xs text-muted-foreground">=</div>
                      <Input type="number" min={1} value={coins} onChange={(e) => setPricingData(prev => prev ? { ...prev, codm: { ...prev.codm, [count]: parseInt(e.target.value) || 0 } } : null)} className="w-24 h-9 text-sm rounded-xl bg-secondary/40" />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><CoinIcon size={12} />coins</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </div>
            {pricingData && (
              <Button onClick={savePricing} disabled={savingPricing} className="w-full h-11 font-bold rounded-xl"
                style={{ background: "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)" }}>
                {savingPricing ? <><Loader2 size={14} className="animate-spin mr-2" />Saving...</> : "Save Pricing Config"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
