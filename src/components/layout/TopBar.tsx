import { Link } from "@tanstack/react-router";
import { Bell, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { user, profile, signOut } = useAuth();

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
          <ThemeSwitcher />
          <button className="relative rounded-lg glass p-2 hover:bg-white/5">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]" />
          </button>

          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg glass px-2 py-1.5 hover:bg-white/5">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-md object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-md gradient-primary grid place-items-center text-xs font-bold text-primary-foreground">
                      {(profile.persona ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block leading-tight text-left">
                    <p className="text-xs font-semibold truncate max-w-[120px]">{profile.persona}</p>
                    <p className="text-[10px] text-muted-foreground">Steam linked</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{profile.persona}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/inventory">My Inventory</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-listings">My Listings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={profile.profile_url ?? "#"} target="_blank" rel="noreferrer">
                    Open Steam profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              className="gradient-primary text-primary-foreground hover:opacity-90"
            >
              <a href="/api/public/steam/login">
                <SteamGlyph className="mr-2 h-4 w-4" /> Sign in with Steam
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function SteamGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 0 0-9.95 9.04l5.4 2.23a2.85 2.85 0 0 1 1.6-.49h.16l2.4-3.47v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.4 2.43v.13a2.85 2.85 0 0 1-5.7.16L2.18 14a10 10 0 1 0 9.82-12Zm-2.93 14.1-1.24-.51a2.16 2.16 0 1 0 1.24.5Zm6.71-7.8a2.52 2.52 0 1 0 2.52 2.52 2.52 2.52 0 0 0-2.52-2.52Z" />
    </svg>
  );
}
