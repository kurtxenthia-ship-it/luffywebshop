import { Layout } from "@/components/Layout";
import { ExternalLink, MessageCircle, Code2, Star, Coins, AlertCircle, Wrench } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-2"
            style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            About
          </h1>
          <p className="text-muted-foreground text-sm">The mind behind COZY XO.SHOP</p>
        </div>

        <div className="relative rounded-2xl border overflow-hidden"
          style={{
            borderColor: "rgba(139,92,246,0.35)",
            background: "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(59,130,246,0.07) 50%, rgba(236,72,153,0.05) 100%)",
            boxShadow: "0 0 40px rgba(139,92,246,0.10)",
          }}>
          <div className="px-6 py-5 border-b flex items-center gap-4"
            style={{ borderColor: "rgba(139,92,246,0.2)" }}>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(271,85%,55%) 0%, hsl(215,85%,52%) 100%)",
                  boxShadow: "0 0 24px rgba(139,92,246,0.5)",
                }}>
                <Code2 size={24} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "hsl(271,85%,65%)", boxShadow: "0 0 8px rgba(139,92,246,0.6)" }}>
                <Star size={10} className="text-white" fill="white" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Web Developer &amp; Owner</div>
              <div className="text-xl font-black"
                style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                @cozybalenciaga
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm leading-relaxed" style={{ color: "hsl(270,15%,82%)" }}>
              Hello! I'm the developer and owner of <span className="font-bold text-violet-300">COZY XO.SHOP</span>.
              I handle everything — from building and maintaining the platform to managing all coin recharge requests.
              If you ever need help, have questions, or run into any issues, please reach out to me directly on Telegram.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact me for:</p>
              <div className="grid gap-2">
                {[
                  { icon: Coins, text: "Coin top-up / recharge requests", color: "hsl(45,90%,65%)" },
                  { icon: AlertCircle, text: "Any errors or bugs on the website", color: "hsl(0,75%,62%)" },
                  { icon: Wrench, text: "Feature suggestions or custom requests", color: "hsl(215,85%,62%)" },
                  { icon: MessageCircle, text: "General questions about the shop", color: "hsl(271,85%,70%)" },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                    style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                    <Icon size={14} style={{ color, flexShrink: 0 }} />
                    <span className="text-xs text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://t.me/cozybalenciaga"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.02] group"
              style={{
                borderColor: "rgba(139,92,246,0.4)",
                background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.10) 100%)",
                boxShadow: "0 0 20px rgba(139,92,246,0.10)",
              }}
              data-testid="link-telegram"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <MessageCircle size={18} className="text-violet-300" />
                </div>
                <div>
                  <div className="text-sm font-black text-violet-200">@cozybalenciaga</div>
                  <div className="text-xs text-muted-foreground">Tap to open Telegram</div>
                </div>
              </div>
              <ExternalLink size={15} className="text-muted-foreground group-hover:text-violet-300 transition-colors" />
            </a>

            <p className="text-xs text-center" style={{ color: "hsl(265,15%,45%)" }}>
              Response time is usually within a few hours. Please be patient — I handle everything alone.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs" style={{ color: "hsl(265,15%,38%)" }}>
            COZY XO.SHOP — Built with passion ✦
          </p>
        </div>
      </div>
    </Layout>
  );
}
