import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Store, User, TrendingUp, Sparkles, Package, Wallet, Shield, MessagesSquare, Settings,
} from "lucide-react";

const sections = [
  {
    label: "Main",
    items: [
      { to: "/", label: "Home", icon: Home },
      { to: "/marketplace", label: "Marketplace", icon: Store },
      { to: "/profile", label: "My Inventory", icon: User },
    ],
  },
  {
    label: "Discover",
    items: [
      { to: "/marketplace", label: "Trending", icon: TrendingUp },
      { to: "/marketplace", label: "New Listings", icon: Sparkles },
      { to: "/marketplace", label: "Cases", icon: Package },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", label: "Wallet", icon: Wallet },
      { to: "/profile", label: "Trade Offers", icon: MessagesSquare },
      { to: "/profile", label: "Security", icon: Shield },
      { to: "/profile", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <div className="h-9 w-9 rounded-lg gradient-primary glow-primary grid place-items-center">
          <span className="font-display text-lg font-bold text-primary-foreground">F</span>
        </div>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-wide text-glow">FRAGMARKET</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">CS2 Skin Market</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-thin">
        {sections.map((sec) => (
          <div key={sec.label} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {sec.label}
            </p>
            <ul className="space-y-0.5">
              {sec.items.map((it) => {
                const active = pathname === it.to;
                const Icon = it.icon;
                return (
                  <li key={it.label}>
                    <Link
                      to={it.to}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground glow-primary"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl glass p-4">
        <p className="text-xs text-muted-foreground">Wallet Balance</p>
        <p className="font-display text-2xl font-bold gradient-text">$2,481.50</p>
        <button className="mt-3 w-full rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
          Deposit Funds
        </button>
      </div>
    </aside>
  );
}
