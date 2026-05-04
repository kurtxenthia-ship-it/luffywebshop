import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useListTxtFiles, useGenerateTxt, getListTxtFilesQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap, FileText, Loader2, Copy, CheckCircle2 } from "lucide-react";

const LINE_OPTIONS = [
  { lines: 50, coins: 20 },
  { lines: 100, coins: 40 },
  { lines: 200, coins: 80 },
];

export default function GeneratorPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ lines: number; coins: number } | null>(null);
  const [result, setResult] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: files, isLoading: filesLoading } = useListTxtFiles({
    query: { queryKey: getListTxtFilesQueryKey() },
  });

  const generateMutation = useGenerateTxt();

  const filesList = (files as Array<{ id: number; name: string; totalLines: number; createdAt: string }> | undefined) ?? [];

  const handleGenerate = () => {
    if (!selectedFile || !selectedOption) return;
    generateMutation.mutate(
      { data: { fileId: selectedFile, lineCount: selectedOption.lines } },
      {
        onSuccess: (res) => {
          const data = res as { lines: string[]; coinsSpent: number; remainingBalance: number };
          setResult(data.lines);
          if (user) {
            setUser({ ...user, balance: data.remainingBalance });
          }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">TXT Generator</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate lines from uploaded files</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <CoinIcon size={18} />
            <span className="font-bold text-sm">{user?.balance ?? 0}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection panel */}
          <div className="space-y-4">
            {/* File selection */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <FileText size={14} />
                Select File
              </h3>
              {filesLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground">
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
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all
                        ${selectedFile === file.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/40 hover:bg-accent/30 text-muted-foreground"
                        }`}
                      data-testid={`button-select-file-${file.id}`}
                    >
                      <div>
                        <div className="text-sm font-semibold">{file.name}</div>
                        <div className="text-xs opacity-70">{file.totalLines} lines available</div>
                      </div>
                      {selectedFile === file.id && <CheckCircle2 size={16} className="text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Line count / cost selection */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Zap size={14} />
                Select Package
              </h3>
              <div className="space-y-2">
                {LINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.lines}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all
                      ${selectedOption?.lines === opt.lines
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-accent/30"
                      }`}
                    data-testid={`button-select-lines-${opt.lines}`}
                  >
                    <span className="text-sm font-semibold">{opt.lines} lines</span>
                    <div className="flex items-center gap-1.5">
                      <CoinIcon size={14} />
                      <span className="text-sm font-bold">{opt.coins} coins</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedFile || !selectedOption || generateMutation.isPending}
              className="w-full h-12 font-bold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" />Generating...</>
              ) : selectedOption ? (
                <><Zap size={16} className="mr-2" />Generate — {selectedOption.coins} coins</>
              ) : (
                "Select options to generate"
              )}
            </Button>
          </div>

          {/* Output panel */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
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
              <div className="flex-1 overflow-auto bg-background rounded-lg border border-border p-3 font-mono text-xs text-foreground/80 min-h-64 max-h-96">
                {result.map((line, i) => (
                  <div key={i} className="py-0.5 hover:bg-accent/30 px-1 rounded" data-testid={`output-line-${i}`}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-64 text-muted-foreground">
                <div className="text-center">
                  <Zap size={32} className="mx-auto mb-2 opacity-20" />
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
