import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareWarning, Loader2, CheckCircle2, XCircle, Zap, Square, ChevronUp, ChevronDown, Gauge } from "lucide-react";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface LogEntry {
  id: number;
  service: string;
  phone: string;
  success: boolean;
  reason?: string;
  round: number;
  ts: string;
}

const SPEED_OPTIONS = [
  { label: "TURBO", ms: 0, color: "hsl(315,75%,65%)" },
  { label: "FAST", ms: 300, color: "hsl(271,85%,65%)" },
  { label: "NORMAL", ms: 700, color: "hsl(215,85%,60%)" },
  { label: "SLOW", ms: 1500, color: "hsl(175,70%,50%)" },
];

function PhoneInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) onChange(raw);
  };

  const formatted = (() => {
    const d = value.startsWith("0") ? value : value ? "0" + value : "";
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  })();

  const isValid = value.replace(/\D/g, "").replace(/^0/, "").length === 10;

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Phone Number</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <span className="text-lg">🇵🇭</span>
          <span className="text-sm font-bold text-muted-foreground">+63</span>
          <div className="w-px h-5" style={{ background: "rgba(139,92,246,0.3)" }} />
        </div>
        <Input
          value={formatted}
          onChange={handleChange}
          disabled={disabled}
          placeholder="09XX XXX XXXX"
          className="pl-24 h-14 text-lg font-mono font-bold tracking-wider rounded-xl transition-all"
          style={{
            background: "hsl(262,38%,6%)",
            border: `2px solid ${isValid && value ? "rgba(139,92,246,0.5)" : "hsl(268,32%,14%)"}`,
            boxShadow: isValid && value ? "0 0 16px rgba(139,92,246,0.15)" : "none",
          }}
          data-testid="input-phone"
        />
        {value && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isValid
              ? <CheckCircle2 size={18} className="text-violet-400" />
              : <XCircle size={18} className="text-red-400" />}
          </div>
        )}
      </div>
      {value && !isValid && (
        <p className="text-xs text-red-400">Must be a valid PH number: 09XXXXXXXXX</p>
      )}
    </div>
  );
}

function QuantityInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rounds (Quantity)</label>
      <div className="flex items-center gap-0">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={disabled || value <= 1}
          className="h-12 w-12 flex items-center justify-center rounded-l-xl border transition-all hover:bg-accent/40 disabled:opacity-40"
          style={{ borderColor: "hsl(268,32%,14%)", background: "hsl(262,38%,6%)" }}
        >
          <ChevronDown size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 h-12 flex items-center justify-center border-y font-black text-xl"
          style={{ borderColor: "hsl(268,32%,14%)", background: "hsl(262,38%,6%)", color: "hsl(271,85%,72%)" }}>
          {value}
        </div>
        <button
          onClick={() => onChange(Math.min(50, value + 1))}
          disabled={disabled || value >= 50}
          className="h-12 w-12 flex items-center justify-center rounded-r-xl border transition-all hover:bg-accent/40 disabled:opacity-40"
          style={{ borderColor: "hsl(268,32%,14%)", background: "hsl(262,38%,6%)" }}
        >
          <ChevronUp size={18} className="text-muted-foreground" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Each round fires all {13} SMS services · Max 50 rounds</p>
    </div>
  );
}

export default function SmsPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ sent: 0, failed: 0, progress: 0, total: 0 });
  const [done, setDone] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.startsWith("0")) return d.slice(1);
    if (d.startsWith("63")) return d.slice(2);
    return d;
  };

  const isValidPhone = formatPhone(phone).length === 10;

  const handleStart = async () => {
    if (!isValidPhone || !user) return;

    const speed = SPEED_OPTIONS[speedIdx];

    if (user.balance < 3) {
      toast({ title: "Insufficient coins", description: "You need 3 coins to use SMS Bomb.", variant: "destructive" });
      return;
    }

    setRunning(true);
    setLogs([]);
    setStats({ sent: 0, failed: 0, progress: 0, total: 0 });
    setDone(false);

    try {
      const response = await fetch(`${BASE_URL}/api/sms/bomb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: formatPhone(phone), quantity, delayMs: speed.ms }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        toast({ title: "Error", description: data.error ?? "Failed to start SMS bomb.", variant: "destructive" });
        setRunning(false);
        return;
      }

      const reader = response.body!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              type: string; service?: string; phone?: string; success?: boolean;
              reason?: string; round?: number; sent?: number; failed?: number;
              progress?: number; ts?: string; remainingBalance?: number; total?: number;
            };

            if (data.type === "start") {
              if (data.remainingBalance !== undefined && user) {
                setUser({ ...user, balance: data.remainingBalance });
              }
            } else if (data.type === "log") {
              setLogs(prev => [...prev, {
                id: ++idRef.current,
                service: data.service ?? "",
                phone: data.phone ?? "",
                success: !!data.success,
                reason: data.reason,
                round: data.round ?? 1,
                ts: data.ts ?? new Date().toISOString(),
              }]);
              setStats({
                sent: data.sent ?? 0,
                failed: data.failed ?? 0,
                progress: data.progress ?? 0,
                total: data.total ?? (quantity * 13),
              });
            } else if (data.type === "done") {
              setDone(true);
              setRunning(false);
              toast({ title: "Bomb complete!", description: `${data.sent} sent, ${data.failed} failed across ${quantity} rounds.` });
            }
          } catch {}
        }
      }
    } catch {
      toast({ title: "Connection error", description: "The stream was interrupted.", variant: "destructive" });
    } finally {
      setRunning(false);
      readerRef.current = null;
    }
  };

  const handleStop = () => {
    readerRef.current?.cancel().catch(() => {});
    setRunning(false);
    toast({ title: "Stopped", description: "SMS Bomb stopped." });
  };

  const speed = SPEED_OPTIONS[speedIdx];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-galaxy">SMS Bomb</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Send OTP requests through multiple services simultaneously</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
            style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.2)" }}>
            <CoinIcon size={16} />
            <span className="font-black text-sm">{user?.balance ?? 0}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5 border space-y-5"
              style={{ background: "hsl(262,38%,6%)", borderColor: "hsl(268,32%,14%)" }}>
              <PhoneInput value={phone} onChange={setPhone} disabled={running} />
              <QuantityInput value={quantity} onChange={setQuantity} disabled={running} />

              {/* Speed control */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Gauge size={12} />Speed
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SPEED_OPTIONS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setSpeedIdx(i)}
                      disabled={running}
                      className="py-2.5 px-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-50"
                      style={speedIdx === i ? {
                        borderColor: s.color,
                        background: `${s.color}18`,
                        color: s.color,
                        boxShadow: `0 0 10px ${s.color}30`,
                      } : {
                        borderColor: "hsl(268,32%,14%)",
                        color: "hsl(265,15%,55%)",
                      }}
                    >
                      {s.label}
                      <div className="text-xs font-normal opacity-70 mt-0.5">{s.ms === 0 ? "Instant" : `${s.ms}ms`}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost badge */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <span className="text-xs text-muted-foreground">Cost per session</span>
                <div className="flex items-center gap-1.5">
                  <CoinIcon size={14} />
                  <span className="text-sm font-black text-violet-300">3 coins</span>
                  <span className="text-xs text-muted-foreground">(flat fee)</span>
                </div>
              </div>

              {/* Action button */}
              {running ? (
                <Button
                  onClick={handleStop}
                  className="w-full h-13 font-black tracking-wider rounded-xl text-white text-base"
                  style={{ background: "linear-gradient(135deg, hsl(0,85%,48%) 0%, hsl(0,85%,38%) 100%)", boxShadow: "0 0 20px rgba(220,38,38,0.35)" }}
                  data-testid="button-stop"
                >
                  <Square size={16} className="mr-2" />STOP BOMB
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={!isValidPhone || !user || (user.balance < 3)}
                  className="w-full h-13 font-black tracking-wider rounded-xl text-white text-base"
                  style={{
                    background: isValidPhone
                      ? "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)"
                      : undefined,
                    boxShadow: isValidPhone ? "0 0 24px rgba(139,92,246,0.4)" : undefined,
                    height: "52px",
                  }}
                  data-testid="button-start"
                >
                  <MessageSquareWarning size={16} className="mr-2" />
                  LAUNCH BOMB 💥
                </Button>
              )}
            </div>

            {/* Stats */}
            {(running || done || logs.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-3 text-center border"
                  style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)" }}>
                  <div className="text-xl font-black text-green-400">{stats.sent}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sent</div>
                </div>
                <div className="rounded-xl p-3 text-center border"
                  style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                  <div className="text-xl font-black text-red-400">{stats.failed}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Failed</div>
                </div>
                <div className="rounded-xl p-3 text-center border"
                  style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.2)" }}>
                  <div className="text-xl font-black text-violet-300">{stats.progress}%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Progress</div>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {(running || done) && stats.total > 0 && (
              <div className="rounded-xl p-4 border"
                style={{ background: "hsl(262,38%,6%)", borderColor: "hsl(268,32%,14%)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-bold text-violet-300">{stats.sent + stats.failed} / {stats.total}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.progress}%`,
                      background: "linear-gradient(90deg, hsl(271,85%,65%) 0%, hsl(215,85%,60%) 100%)",
                      boxShadow: "0 0 8px rgba(139,92,246,0.5)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Terminal log */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border overflow-hidden h-full min-h-[480px] flex flex-col"
              style={{ background: "hsl(260,45%,2%)", borderColor: "rgba(139,92,246,0.2)" }}>
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ background: "hsl(262,40%,5%)", borderColor: "rgba(139,92,246,0.15)" }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground ml-1">cozy_smsbomb — terminal</span>
                {running && <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400 font-mono">LIVE</span></div>}
                {done && <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" /><span className="text-xs text-violet-400 font-mono">COMPLETE</span></div>}
              </div>

              {/* Log content */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-0.5">
                {logs.length === 0 && !running && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquareWarning size={32} className="mb-3 opacity-20" />
                    <p className="text-sm">Waiting for launch...</p>
                    <p className="text-xs mt-1 opacity-60">Configure target and press LAUNCH BOMB</p>
                  </div>
                )}
                {running && logs.length === 0 && (
                  <div className="flex items-center gap-2 text-violet-400">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Initializing SMS services...</span>
                  </div>
                )}
                {logs.map((log) => {
                  const time = new Date(log.ts).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  return (
                    <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-white/3 px-1 rounded group">
                      {log.success
                        ? <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                        : <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />}
                      <span className="text-muted-foreground/60">[{time}]</span>
                      <span className="text-violet-300/80">R{log.round}</span>
                      <span className="font-bold" style={{ color: log.success ? "hsl(150,70%,55%)" : "hsl(0,70%,60%)" }}>
                        {log.success ? "[SENT]" : "[FAIL]"}
                      </span>
                      <span className="text-cyan-400/80">{log.service}</span>
                      <span className="text-muted-foreground/50">›</span>
                      <span className="text-foreground/70">{log.phone}</span>
                      {!log.success && log.reason && (
                        <span className="text-red-400/60">({log.reason})</span>
                      )}
                    </div>
                  );
                })}
                {done && (
                  <div className="mt-3 p-3 rounded-lg border text-center"
                    style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }}>
                    <div className="text-violet-300 font-bold">✦ BOMB COMPLETE ✦</div>
                    <div className="text-muted-foreground text-xs mt-1">
                      <span className="text-green-400 font-bold">{stats.sent} sent</span>
                      {" · "}
                      <span className="text-red-400 font-bold">{stats.failed} failed</span>
                      {" · "}
                      <span className="text-violet-300">3 coins spent</span>
                    </div>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
