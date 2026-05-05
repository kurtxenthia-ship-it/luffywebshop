import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useListTxtFiles, useGenerateTxt, getListTxtFilesQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Zap, FileText, Loader2, Copy, CheckCircle2, Sliders } from "lucide-react";

const LINE_OPTIONS = [
  { lines: 1000, coins: 10, label: "1K" },
  { lines: 2000, coins: 20, label: "2K" },
  { lines: 3000, coins: 30, label: "3K" },
  { lines: 4000, coins: 40, label: "4K" },
  { lines: 5000, coins: 50, label: "5K" },
];

export default function GeneratorPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ lines: number; coins: number } | null>(null);
  const [customLines, setCustomLines] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: files, isLoading: filesLoading } = useListTxtFiles({
    query: { queryKey: getListTxtFilesQueryKey() },
  });

  const generateMutation = useGenerateTxt();

  const filesList = (files as Array<{ id: number; name: string; totalLines: number; createdAt: string }> | undefined) ?? [];

  const customLineCount = parseInt(customLines) || 0;
  const customCoinCost = customLineCount > 0 ? Math.ceil(customLineCount / 1000) * 10 : 0;

  const activeOption = useCustom
    ? (customLineCount > 0 ? { lines: customLineCount, coins: customCoinCost } : null)
    : selectedOption;

  const handleGenerate = () => {
    if (!selectedFile || !activeOption) return;
    generateMutation.mutate(
      { data: { fileId: selectedFile, lineCount: activeOption.lines } },
      {
        onSuccess: (res) => {
          const data = res as { lines: string[]; coinsSpent: number; remainingBalance: number };
          setResult(data.lines);
          if (user) setUser({ ...user, balance: data.remainingBalance });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Generated!", description: `${data.lines.length} lines generated. ${data.coinsSpent} coins spent.` });
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to generate";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span style={{ background: "linear-gradient(135deg, hsl(0,85%,62%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                TXT Generator
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Generate lines from uploaded files using coins</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
            <CoinIcon size={17} />
            <span className="font-black text-sm">{user?.balance ?? 0}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection panel */}
          <div className="space-y-4">
            {/* File selection */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <FileText size={13} />
                Select File
              </h3>
              {filesLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading files...
                </div>
              ) : filesList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No files available. Admin needs to upload files.</p>
              ) : (
                <div className="space-y-2">
                  {filesList.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200
                        ${selectedFile === file.id
                          ? "border-primary/60 text-foreground"
                          : "border-border hover:border-primary/30 hover:bg-accent/20 text-muted-foreground"
                        }`}
                      style={selectedFile === file.id ? { background: "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(59,130,246,0.05) 100%)" } : {}}
                      data-testid={`button-select-file-${file.id}`}
                    >
                      <div>
                        <div className="text-sm font-semibold">{file.name}</div>
                        <div className="text-xs opacity-60 mt-0.5">{file.totalLines.toLocaleString()} lines available</div>
                      </div>
                      {selectedFile === file.id && <CheckCircle2 size={15} className="text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Line package selection */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Zap size={13} />
                Select Package
              </h3>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {LINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.lines}
                    onClick={() => { setSelectedOption(opt); setUseCustom(false); }}
                    className={`flex flex-col items-center py-3 px-1 rounded-xl border transition-all duration-200
                      ${!useCustom && selectedOption?.lines === opt.lines
                        ? "border-primary/60 text-foreground"
                        : "border-border hover:border-primary/30 hover:bg-accent/20 text-muted-foreground"
                      }`}
                    style={!useCustom && selectedOption?.lines === opt.lines ? { background: "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(59,130,246,0.06) 100%)" } : {}}
                    data-testid={`button-select-lines-${opt.lines}`}
                  >
                    <span className="text-sm font-black">{opt.label}</span>
                    <div className="flex items-center gap-0.5 mt-1">
                      <CoinIcon size={11} />
                      <span className="text-xs font-bold">{opt.coins}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom lines */}
              <button
                onClick={() => { setUseCustom(true); setSelectedOption(null); }}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 mb-3
                  ${useCustom
                    ? "border-primary/60 text-foreground"
                    : "border-border hover:border-primary/30 hover:bg-accent/20 text-muted-foreground"
                  }`}
                style={useCustom ? { background: "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(59,130,246,0.05) 100%)" } : {}}
                data-testid="button-select-custom"
              >
                <Sliders size={13} />
                <span className="text-sm font-semibold">Custom Lines</span>
                {useCustom && customLineCount > 0 && (
                  <div className="ml-auto flex items-center gap-1">
                    <CoinIcon size={12} />
                    <span className="text-xs font-bold">{customCoinCost} coins</span>
                  </div>
                )}
              </button>

              {useCustom && (
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={1}
                    max={100000}
                    value={customLines}
                    onChange={(e) => setCustomLines(e.target.value)}
                    placeholder="Enter number of lines (e.g. 1500)"
                    className="bg-secondary/50 h-10 text-sm"
                    data-testid="input-custom-lines"
                  />
                  {customLineCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Cost: {Math.ceil(customLineCount / 1000)} × 10 = <span className="text-primary font-bold">{customCoinCost} coins</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedFile || !activeOption || generateMutation.isPending}
              className="w-full h-12 font-bold text-base rounded-xl shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, hsl(0,85%,48%) 0%, hsl(0,85%,40%) 100%)", boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" />Generating...</>
              ) : activeOption ? (
                <><Zap size={16} className="mr-2" />Generate — {activeOption.coins} coins</>
              ) : (
                "Select options to generate"
              )}
            </Button>
          </div>

          {/* Output panel */}
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output</h3>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  data-testid="button-copy-output"
                >
                  {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy all"}
                </button>
              )}
            </div>
            {result ? (
              <div className="flex-1 overflow-auto rounded-xl border border-border p-3 font-mono text-xs text-foreground/80 min-h-64 max-h-[480px]"
                style={{ background: "hsl(222,18%,3%)" }}>
                {result.map((line, i) => (
                  <div key={i} className="py-0.5 hover:bg-accent/20 px-1 rounded" data-testid={`output-line-${i}`}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-64 text-muted-foreground rounded-xl border border-border"
                style={{ background: "hsl(222,18%,3%)" }}>
                <div className="text-center">
                  <Zap size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Generated lines will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
