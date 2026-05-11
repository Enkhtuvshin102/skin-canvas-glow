import { Check, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, useTheme, type Theme } from "./ThemeProvider";

const THEME_META: Record<Theme, { label: string; swatch: string; desc: string }> = {
  dark:    { label: "Dark",    desc: "Default esports",   swatch: "linear-gradient(135deg,#3b82f6,#a855f7)" },
  light:   { label: "Light",   desc: "Bright & clean",    swatch: "linear-gradient(135deg,#f8fafc,#cbd5e1)" },
  green:   { label: "Green",   desc: "Trading terminal",  swatch: "linear-gradient(135deg,#16a34a,#4ade80)" },
  neon:    { label: "Neon",    desc: "Cyberpunk pop",     swatch: "linear-gradient(135deg,#ec4899,#22d3ee)" },
  legacy:  { label: "Legacy",  desc: "Classic Steam",     swatch: "linear-gradient(135deg,#d97706,#475569)" },
  dynamic: { label: "Dynamic", desc: "Animated hue",      swatch: "conic-gradient(from 0deg,#3b82f6,#a855f7,#ec4899,#22d3ee,#22c55e,#3b82f6)" },
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const current = THEME_META[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg glass px-2.5 py-2 text-xs hover:bg-white/5"
          aria-label="Choose theme"
        >
          <span
            className="h-4 w-4 rounded-full ring-1 ring-white/20"
            style={{ background: current.swatch }}
          />
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden lg:inline font-semibold">{current.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Choose Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => {
          const meta = THEME_META[t];
          const active = theme === t;
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-white/15"
                style={{ background: meta.swatch }}
              />
              <span className="flex-1 leading-tight">
                <span className="block text-sm font-medium">{meta.label}</span>
                <span className="block text-[10px] text-muted-foreground">{meta.desc}</span>
              </span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
