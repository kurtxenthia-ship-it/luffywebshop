import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { CoinIcon } from "@/components/CoinIcon";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Zap, Gamepad2, Info, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generator", label: "TXT Generator", icon: Zap },
  { href: "/codm", label: "CODM Accounts", icon: Gamepad2 },
  { href: "/about", label: "About", icon: Info },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = user?.isAdmin
    ? [...navItems, { href: "/admin", label: "Admin Panel", icon: ShieldCheck }]
    : navItems;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}
        style={{ background: "linear-gradient(180deg, hsl(224,20%,5%) 0%, hsl(220,18%,4%) 100%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(0,85%,50%) 0%, hsl(215,85%,55%) 100%)", boxShadow: "0 0 16px rgba(220,38,38,0.35)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z" fill="white" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-black tracking-tight" style={{ background: "linear-gradient(135deg, hsl(0,85%,62%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              LUFFY XO
            </div>
            <div className="text-xs text-muted-foreground font-medium">.SHOP</div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-sidebar-border">
            <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(59,130,246,0.08) 100%)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div className="text-xs text-muted-foreground mb-0.5">Account</div>
              <div className="text-xs font-mono font-bold" style={{ color: "hsl(215,85%,62%)" }}>{user.userId}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <CoinIcon size={15} />
                <span className="text-sm font-black text-foreground">{user.balance}</span>
                <span className="text-xs text-muted-foreground">coins</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allNav.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}
                style={active ? {
                  background: "linear-gradient(135deg, hsl(0,85%,45%) 0%, hsl(0,85%,38%) 100%)",
                  boxShadow: "0 0 12px rgba(220,38,38,0.3)",
                } : {}}
                data-testid={`nav-link-${href.replace("/", "")}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer nav */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/40 gap-3 rounded-xl"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut size={15} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border lg:hidden" style={{ background: "hsl(224,20%,5%)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(0,85%,50%) 0%, hsl(215,85%,55%) 100%)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z" fill="white" />
              </svg>
            </div>
            <span className="font-black text-sm tracking-tight">LUFFY XO.SHOP</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent/40 transition-colors"
            data-testid="button-mobile-menu"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        <footer className="text-center py-3 border-t border-border">
          <p className="text-xs text-muted-foreground/40">
            @web is designed by t.me/cozybalenciaga &nbsp;|&nbsp; @cozy x luffy web generator
          </p>
        </footer>
      </div>
    </div>
  );
}
