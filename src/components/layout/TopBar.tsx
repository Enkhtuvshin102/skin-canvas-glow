import { Link } from "@tanstack/react-router";
import { Bell, Search, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Link to="/" className="md:hidden font-display text-lg font-bold gradient-text">
          FRAGMARKET
        </Link>
        <div className="relative hidden md:block flex-1 max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skins, weapons, stickers, sellers..."
            className="h-10 pl-9 bg-surface/60 border-border/60 focus-visible:ring-primary"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="hidden md:flex items-center gap-2 rounded-lg glass px-3 py-2 text-xs">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="font-semibold">$2,481.50</span>
          </button>
          <button className="relative rounded-lg glass p-2 hover:bg-white/5">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
          </button>
          <Link to="/profile" className="flex items-center gap-2 rounded-lg glass px-2 py-1.5 hover:bg-white/5">
            <div className="h-7 w-7 rounded-md gradient-primary grid place-items-center text-xs font-bold text-primary-foreground">
              KZ
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-semibold">kzero</p>
              <p className="text-[10px] text-muted-foreground">Lvl 42</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
