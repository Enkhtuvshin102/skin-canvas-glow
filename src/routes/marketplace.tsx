import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SkinCard } from "@/components/skin/SkinCard";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { SKINS, type Wear } from "@/lib/skins-data";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — FragMarket" },
      { name: "description", content: "Browse, filter and buy CS2 skins by float, wear, weapon, rarity and price." },
    ],
  }),
  component: MarketplacePage,
});

const WEARS: Wear[] = ["FN", "MW", "FT", "WW", "BS"];
const WEAPONS = Array.from(new Set(SKINS.map((s) => s.weapon))).sort();

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [wears, setWears] = useState<Wear[]>([]);
  const [weapons, setWeapons] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 15000]);
  const [stOnly, setStOnly] = useState(false);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "float-asc" | "newest">("newest");

  const filtered = useMemo(() => {
    const list = SKINS.filter((s) => {
      if (q && !s.fullName.toLowerCase().includes(q.toLowerCase())) return false;
      if (wears.length && !wears.includes(s.wear)) return false;
      if (weapons.length && !weapons.includes(s.weapon)) return false;
      if (s.price < price[0] || s.price > price[1]) return false;
      if (stOnly && !s.stattrak) return false;
      return true;
    });
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "float-asc") list.sort((a, b) => a.float - b.float);
    return list;
  }, [q, wears, weapons, price, stOnly, sort]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className="rounded-xl glass p-4 h-fit lg:sticky lg:top-20 space-y-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold tracking-wide">Filters</h2>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Wear</p>
            <div className="flex flex-wrap gap-1.5">
              {WEARS.map((w) => {
                const active = wears.includes(w);
                return (
                  <button
                    key={w}
                    onClick={() => toggle(wears, w, setWears)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      active ? "gradient-primary text-primary-foreground glow-primary" : "glass hover:bg-white/5"
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Price · ${price[0].toLocaleString()} – ${price[1].toLocaleString()}
            </p>
            <Slider
              value={price}
              min={0}
              max={15000}
              step={50}
              onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
            />
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Weapons</p>
            <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
              {WEAPONS.map((w) => (
                <label key={w} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={weapons.includes(w)}
                    onCheckedChange={() => toggle(weapons, w, setWeapons)}
                  />
                  <span className="truncate">{w}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={stOnly} onCheckedChange={(v) => setStOnly(!!v)} />
            <span>StatTrak™ only</span>
          </label>
        </aside>

        {/* Listings */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Dragon Lore, Asiimov, Doppler…"
                className="h-11 pl-9 bg-surface/60"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-11 rounded-md bg-surface/60 border border-border/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="float-asc">Float: Lowest first</option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} listings · live market
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((s) => (
              <SkinCard key={s.id} skin={s} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl glass p-10 text-center text-muted-foreground">
              No skins match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
