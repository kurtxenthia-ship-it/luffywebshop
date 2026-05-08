import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { CoinIcon } from "@/components/CoinIcon";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Zap, Gamepad2, Info, ShieldCheck, LogOut, Menu,
  MessageSquareWarning, Search, MessageCircle, Shield
} from "lucide-react";

interface LayoutProps { children: ReactNode; }

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generator", label: "TXT Generator", icon: Zap },
  { href: "/codm", label: "CODM Accounts", icon: Gamepad2 },
  { href: "/sms", label: "SMS Bomb", icon: MessageSquareWarning },
  { href: "/tg", label: "TG Lookup", icon: Search },
  { href: "/checker", label: "Checker", icon: Shield },
  { href: "/feedback", label: "Feedback", icon: MessageCircle },
  { href: "/about", label: "About", icon: Info },
];

function ShopLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sc-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="60%" stopColor="hsl(271,85%,78%)" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="hsl(215,85%,65%)" stopOpacity="0.5"/>
        </radialGradient>
        <linearGradient id="sc-arm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(271,85%,70%)" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="hsl(215,85%,65%)" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="hsl(315,75%,65%)" stopOpacity="0.4"/>
        </linearGradient>
        <filter id="sc-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M16 16 Q26 6 27 16 Q26 26 16 27 Q6 26 5 16 Q6 6 16 5" stroke="url(#sc-arm)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M16 16 Q21 11 22 16 Q21 21 16 22 Q11 21 10 16 Q11 11 16 10" stroke="url(#sc-arm)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.55"/>
      <circle cx="16" cy="16" r="4.5" fill="url(#sc-core)" filter="url(#sc-glow)" opacity="0.9"/>
      <circle cx="16" cy="16" r="2" fill="white" opacity="0.95"/>
      <circle cx="4" cy="5" r="1.1" fill="white" opacity="0.9"/>
      <circle cx="28" cy="4" r="0.8" fill="hsl(271,85%,85%)" opacity="0.8"/>
      <circle cx="29" cy="25" r="0.9" fill="white" opacity="0.7"/>
      <circle cx="3" cy="27" r="0.7" fill="hsl(215,85%,80%)" opacity="0.8"/>
      <circle cx="27" cy="28" r="0.6" fill="hsl(315,75%,80%)" opacity="0.75"/>
    </svg>
  );
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = user?.isAdmin
    ? [...navItems, { href: "/admin", label: "Admin Panel", icon: ShieldCheck }]
    : navItems;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-sidebar-border transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}
        style={{
          background: "linear-gradient(180deg, hsl(264,42%,4%) 0%, hsl(262,40%,3%) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, hsl(271,85%,65%) 0%, transparent 70%)", filter: "blur(20px)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.2) 100%)",
              border: "1px solid rgba(139,92,246,0.4)",
              boxShadow: "0 0 20px rgba(139,92,246,0.3), inset 0 0 10px rgba(139,92,246,0.1)",
            }}>
            <ShopLogo size={22} />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight"
              style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              COZY XO
            </div>
            <div className="text-xs font-medium" style={{ color: "hsl(271,60%,70%)" }}>.SHOP</div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3.5 border-b border-sidebar-border">
            <div className="rounded-xl p-3"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(59,130,246,0.07) 100%)", border: "1px solid rgba(139,92,246,0.18)" }}>
              <div className="text-xs font-mono font-bold" style={{ color: "hsl(271,75%,72%)" }}>{user.userId}</div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">{user.username}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <CoinIcon size={14} />
                <span className="text-sm font-black text-foreground">{user.balance}</span>
                <span className="text-xs text-muted-foreground">coins</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNav.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80"}`}
                style={active ? {
                  background: "linear-gradient(135deg, rgba(139,92,246,0.30) 0%, rgba(59,130,246,0.22) 100%)",
                  border: "1px solid rgba(139,92,246,0.35)",
                  boxShadow: "0 0 14px rgba(139,92,246,0.2)",
                } : {}}
                onClick={() => setMobileOpen(false)}
                data-testid={`nav-link-${href.replace("/", "")}`}
              >
                <Icon size={15} className={active ? "text-violet-300" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 gap-3 rounded-xl text-sm"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border lg:hidden"
          style={{ background: "hsl(264,42%,4%)" }}>
          <div className="flex items-center gap-2.5">
            <ShopLogo size={18} />
            <span className="font-black text-sm tracking-tight"
              style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              COZY XO.SHOP
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent/30 transition-colors"
            data-testid="button-mobile-menu"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>

        <footer className="text-center py-3 border-t border-border">
          <p className="text-xs" style={{ color: "hsl(271,30%,40%)" }}>
            Designed &amp; developed by{" "}
            <a href="https://t.me/cozybalenciaga" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors font-semibold">
              @cozybalenciaga
            </a>
            {" "}· COZY XO.SHOP
          </p>
        </footer>
      </div>
    </div>
  );
}
