import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, XCircle, AlertCircle, Loader2, FileText, Play, Square, Shield } from "lucide-react";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

function getLineCost(lines: number): number {
  if (lines <= 200) return 20;
  if (lines <= 500) return 50;
  if (lines <= 1000) return 100;
  return 100;
}

interface ScanResult {
  index: number;
  combo: string;
  status: "valid" | "invalid" | "error";
  details?: string;
}

export default function CheckerPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [fileContent, setFileContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [lineCount, setLineCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState({ valid: 0, invalid: 0, errors: 0, progress: 0, total: 0 });
  const [done, setDone] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results]);

  const parseFile = (text: string, name: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0 && l.includes(":"));
    setFileContent(text);
    setFilename(name);
    setLineCount(lines.length);
    setResults([]);
    setDone(false);
    setStats({ valid: 0, invalid: 0, errors: 0, progress: 0, total: 0 });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseFile(ev.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseFile(ev.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const cost = lineCount > 0 ? getLineCost(lineCount) : 0;
  const canAfford = (user?.balance ?? 0) >= cost;

  const handleScan = async () => {
    if (!fileContent || lineCount === 0 || !user) return;
    setRunning(true);
    setResults([]);
    setDone(false);
    setStats({ valid: 0, invalid: 0, errors: 0, progress: 0, total: lineCount });

    try {
      const response = await fetch(`${BASE_URL}/api/checker/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ filename, content: fileContent }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        toast({ title: "Error", description: data.error ?? "Scan failed.", variant: "destructive" });
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
              type: string; index?: number; total?: number; combo?: string; status?: string;
              details?: string; progress?: number; valid?: number; invalid?: number; errors?: number;
              coinsSpent?: number; remainingBalance?: number; jobId?: number;
            };

            if (data.type === "start" && data.remainingBalance !== undefined && user) {
              setUser({ ...user, balance: data.remainingBalance });
            } else if (data.type === "result") {
              setResults(prev => [...prev, {
                index: data.index ?? 0,
                combo: data.combo ?? "",
                status: (data.status as "valid" | "invalid" | "error") ?? "error",
                details: data.details,
              }]);
              setStats({
                valid: data.valid ?? 0,
                invalid: data.invalid ?? 0,
                errors: data.errors ?? 0,
                progress: data.progress ?? 0,
                total: data.total ?? lineCount,
              });
            } else if (data.type === "done") {
              setDone(true);
              setRunning(false);
              toast({ title: "Scan complete!", description: `${data.valid} valid, ${data.invalid} invalid, ${data.errors} errors.` });
            }
          } catch {}
        }
      }
    } catch {
      toast({ title: "Stream error", description: "Connection interrupted.", variant: "destructive" });
    } finally {
      setRunning(false);
      readerRef.current = null;
    }
  };

  const handleStop = () => {
    readerRef.current?.cancel().catch(() => {});
    setRunning(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Account Checker
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Upload a combo list to check Garena account validity</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
            style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.2)" }}>
            <CoinIcon size={16} />
            <span className="font-black text-sm">{user?.balance ?? 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Upload + controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload zone */}
            <div
              className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${dragging ? "scale-[1.02]" : ""}`}
              style={{
                borderColor: dragging ? "hsl(271,85%,65%)" : (fileContent ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.2)"),
                background: dragging ? "rgba(139,92,246,0.08)" : (fileContent ? "rgba(139,92,246,0.05)" : "rgba(139,92,246,0.02)"),
              }}
              onClick={() => !running && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              data-testid="dropzone"
            >
              <input ref={fileInputRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleFileInput} />
              {fileContent ? (
                <>
                  <FileText size={28} className="mx-auto mb-2 text-violet-400" />
                  <p className="font-bold text-sm text-foreground">{filename}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lineCount} valid combo lines</p>
                  {!running && <p className="text-xs text-violet-400 mt-2">Click to change file</p>}
                </>
              ) : (
                <>
                  <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="font-bold text-sm text-foreground">Drop .txt file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse — format: email:password per line</p>
                </>
              )}
            </div>

            {/* Pricing tiers */}
            <div className="rounded-2xl border p-4 space-y-3"
              style={{ background: "hsl(262,38%,6%)", borderColor: "hsl(268,32%,14%)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pricing Tiers</p>
              {[{ lines: "Up to 200", cost: 20 }, { lines: "Up to 500", cost: 50 }, { lines: "Up to 1,000", cost: 100 }].map(t => (
                <div key={t.lines} className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all ${fileContent && lineCount <= (t.lines === "Up to 200" ? 200 : t.lines === "Up to 500" ? 500 : 1000) && cost === t.cost ? "border-violet-500/40" : "border-transparent"}`}
                  style={fileContent && cost === t.cost ? { background: "rgba(139,92,246,0.08)" } : { background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-xs text-muted-foreground">{t.lines} lines</span>
                  <div className="flex items-center gap-1"><CoinIcon size={12} /><span className="text-xs font-bold text-violet-300">{t.cost} coins</span></div>
                </div>
              ))}
            </div>

            {/* Cost summary */}
            {fileContent && (
              <div className="p-3.5 rounded-xl border"
                style={{ background: canAfford ? "rgba(139,92,246,0.08)" : "rgba(239,68,68,0.08)", borderColor: canAfford ? "rgba(139,92,246,0.25)" : "rgba(239,68,68,0.3)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cost for {lineCount} lines</span>
                  <div className="flex items-center gap-1.5"><CoinIcon size={13} /><span className="text-sm font-black" style={{ color: canAfford ? "hsl(271,75%,72%)" : "hsl(0,75%,62%)" }}>{cost} coins</span></div>
                </div>
                {!canAfford && <p className="text-xs text-red-400 mt-1.5">Insufficient coins — need {cost}, you have {user?.balance ?? 0}.</p>}
              </div>
            )}

            {/* Action button */}
            {running ? (
              <Button onClick={handleStop} className="w-full h-12 font-black rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, hsl(0,85%,48%) 0%, hsl(0,85%,38%) 100%)" }}>
                <Square size={14} className="mr-2" />STOP SCAN
              </Button>
            ) : (
              <Button onClick={handleScan} disabled={!fileContent || !canAfford || lineCount === 0}
                className="w-full h-12 font-black rounded-xl text-white"
                style={{ background: fileContent && canAfford ? "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,50%) 100%)" : undefined, boxShadow: fileContent && canAfford ? "0 0 20px rgba(139,92,246,0.35)" : undefined }}
                data-testid="button-start-scan">
                <Play size={14} className="mr-2" />START SCAN
              </Button>
            )}

            {/* Stats */}
            {(running || done || results.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-3 text-center border" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)" }}>
                  <div className="text-xl font-black text-green-400">{stats.valid}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Valid</div>
                </div>
                <div className="rounded-xl p-3 text-center border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                  <div className="text-xl font-black text-red-400">{stats.invalid}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Invalid</div>
                </div>
                <div className="rounded-xl p-3 text-center border" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }}>
                  <div className="text-xl font-black" style={{ color: "hsl(45,90%,65%)" }}>{stats.errors}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Errors</div>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {(running || done) && stats.total > 0 && (
              <div className="rounded-xl p-4 border" style={{ background: "hsl(262,38%,6%)", borderColor: "hsl(268,32%,14%)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-bold text-violet-300">{stats.valid + stats.invalid + stats.errors} / {stats.total}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${stats.progress}%`, background: "linear-gradient(90deg, hsl(271,85%,65%) 0%, hsl(215,85%,60%) 100%)", boxShadow: "0 0 8px rgba(139,92,246,0.5)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Right: Results terminal */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border overflow-hidden h-full min-h-[480px] flex flex-col"
              style={{ background: "hsl(260,45%,2%)", borderColor: "rgba(139,92,246,0.2)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ background: "hsl(262,40%,5%)", borderColor: "rgba(139,92,246,0.15)" }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground ml-1">cozy_checker — results</span>
                {running && <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400 font-mono">SCANNING</span></div>}
                {done && <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" /><span className="text-xs text-violet-400 font-mono">COMPLETE</span></div>}
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-0.5">
                {results.length === 0 && !running && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Shield size={32} className="mb-3 opacity-20" />
                    <p className="text-sm">Waiting for scan...</p>
                    <p className="text-xs mt-1 opacity-60">Upload a combo list and press START SCAN</p>
                  </div>
                )}
                {running && results.length === 0 && (
                  <div className="flex items-center gap-2 text-violet-400">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Initializing checker...</span>
                  </div>
                )}
                {results.map((r) => (
                  <div key={r.index} className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-white/3">
                    {r.status === "valid"
                      ? <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                      : r.status === "invalid"
                      ? <XCircle size={12} className="text-red-400 flex-shrink-0" />
                      : <AlertCircle size={12} className="text-yellow-400 flex-shrink-0" />}
                    <span className="font-bold w-8 text-muted-foreground/50">#{r.index}</span>
                    <span className="font-bold" style={{ color: r.status === "valid" ? "hsl(150,70%,55%)" : r.status === "invalid" ? "hsl(0,70%,60%)" : "hsl(45,80%,60%)" }}>
                      [{r.status.toUpperCase()}]
                    </span>
                    <span className="text-foreground/70 truncate flex-1">{r.combo}</span>
                    {r.details && <span className="text-muted-foreground/50 flex-shrink-0">({r.details})</span>}
                  </div>
                ))}
                {done && (
                  <div className="mt-3 p-3 rounded-lg border text-center"
                    style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }}>
                    <div className="text-violet-300 font-bold">✦ SCAN COMPLETE ✦</div>
                    <div className="text-muted-foreground text-xs mt-1">
                      <span className="text-green-400 font-bold">{stats.valid} valid</span>
                      {" · "}
                      <span className="text-red-400 font-bold">{stats.invalid} invalid</span>
                      {" · "}
                      <span className="font-bold" style={{ color: "hsl(45,80%,60%)" }}>{stats.errors} errors</span>
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
