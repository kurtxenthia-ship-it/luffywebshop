import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { CoinIcon } from "@/components/CoinIcon";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Zap, Gamepad2, CreditCard, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generator", label: "TXT Generator", icon: Zap },
  { href: "/codm", label: "CODM Accounts", icon: Gamepad2 },
  { href: "/topup", label: "Add Balance", icon: CreditCard },
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
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z" fill="white" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground">LUFFY XO</div>
            <div className="text-xs text-muted-foreground">.SHOP</div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-border">
            <div className="bg-accent/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">User ID</div>
              <div className="text-xs font-mono text-primary font-bold">{user.userId}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <CoinIcon size={16} />
                <span className="text-sm font-bold text-foreground">{user.balance}</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
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
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 gap-3"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-sm">LUFFY XO.SHOP</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-mobile-menu"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center py-3 border-t border-border">
          <p className="text-xs text-muted-foreground/50">
            @web is designed by t.me/cozybalenciaga &nbsp;|&nbsp; @cozy x luffy web generator
          </p>
        </footer>
      </div>
    </div>
  );
}
