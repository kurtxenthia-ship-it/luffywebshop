import { Layout } from "@/components/Layout";
import { ExternalLink, MessageCircle, Code2, ShoppingBag } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-2">
            <span style={{ background: "linear-gradient(135deg, hsl(0,85%,62%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              About
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">The people behind LUFFY XO.SHOP</p>
        </div>

        {/* Seller card */}
        <div className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.01]"
          style={{ borderColor: "rgba(220,38,38,0.3)", background: "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.03) 100%)", boxShadow: "0 0 30px rgba(220,38,38,0.08)" }}>
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(0,85%,50%) 0%, hsl(0,85%,38%) 100%)", boxShadow: "0 0 16px rgba(220,38,38,0.4)" }}>
              <ShoppingBag size={18} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seller / Owner</div>
              <div className="text-base font-black text-foreground">LUFFY XO</div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Contact the seller for coin top-ups, account inquiries, custom requests, and support. 
              All purchases and transactions are handled through the official Telegram.
            </p>
            <a
              href="https://t.me/LUFFYVIPONE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] group"
              style={{ borderColor: "rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.2)" }}>
                  <MessageCircle size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold">@LUFFYVIPONE</div>
                  <div className="text-xs text-muted-foreground">Telegram</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>

        {/* Developer card */}
        <div className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.01]"
          style={{ borderColor: "rgba(59,130,246,0.3)", background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 100%)", boxShadow: "0 0 30px rgba(59,130,246,0.08)" }}>
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(59,130,246,0.2)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(215,85%,55%) 0%, hsl(215,85%,42%) 100%)", boxShadow: "0 0 16px rgba(59,130,246,0.4)" }}>
              <Code2 size={18} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website Developer</div>
              <div className="text-base font-black text-foreground">cozybalenciaga</div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The developer behind the LUFFY XO.SHOP platform. For website-related inquiries, 
              bug reports, or custom development work, reach out on Telegram.
            </p>
            <a
              href="https://t.me/cozybalenciaga"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] group"
              style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.2)" }}>
                  <MessageCircle size={16} style={{ color: "hsl(215,85%,62%)" }} />
                </div>
                <div>
                  <div className="text-sm font-bold">@cozybalenciaga</div>
                  <div className="text-xs text-muted-foreground">Telegram</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground/50">
            LUFFY XO.SHOP — Powered by coins. Built with care.
          </p>
        </div>
      </div>
    </Layout>
  );
}
