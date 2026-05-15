import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { type Wear } from "@/lib/skins-data";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/skin/ListingCard";
import { useListings } from "@/hooks/use-listings";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — FragMarket" },
      { name: "description", content: "Live P2P CS2 skin listings. Float, stickers, inspect links — items stay in seller Steam inventories." },
    ],
  }),
  component: MarketplacePage,
});

const WEARS: Wear[] = ["FN", "MW", "FT", "WW", "BS"];

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [stickerQ, setStickerQ] = useState("");
  const [wears, setWears] = useState<Wear[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 15000]);
  const [stOnly, setStOnly] = useState(false);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "float-asc" | "newest">("newest");
  const [limit, setLimit] = useState(50);

  const listings = useListings({ limit: 500, statuses: ["active", "unavailable", "sold"] });

  const filtered = useMemo(() => {
    let list = (listings.data ?? []).filter((s) => {
      if (q && !`${s.weapon} ${s.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (wears.length && !wears.includes(s.wear as Wear)) return false;
      if (Number(s.price_usd) < price[0] || Number(s.price_usd) > price[1]) return false;
      if (stOnly && !s.stattrak) return false;
      if (stickerQ) {
        const stickers = (s.stickers as Array<{ name: string }>) ?? [];
        if (!stickers.some((st) => st.name.toLowerCase().includes(stickerQ.toLowerCase()))) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => Number(a.price_usd) - Number(b.price_usd));
    if (sort === "price-desc") list = [...list].sort((a, b) => Number(b.price_usd) - Number(a.price_usd));
    if (sort === "float-asc") list = [...list].sort((a, b) => Number(a.float) - Number(b.float));
    return list.slice(0, limit);
  }, [listings.data, q, stickerQ, wears, price, stOnly, sort, limit]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
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
                  <button key={w} onClick={() => setWears(active ? wears.filter((x) => x !== w) : [...wears, w])}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${active ? "gradient-primary text-primary-foreground glow-primary" : "glass hover:bg-white/5"}`}>{w}</button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Price · ${price[0]} – ${price[1]}</p>
            <Slider value={price} min={0} max={15000} step={50} onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])} />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Sticker search</p>
            <Input value={stickerQ} onChange={(e) => setStickerQ(e.target.value)} placeholder="Katowice 2014…" className="h-9" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={stOnly} onCheckedChange={(v) => setStOnly(!!v)} />
            <span>StatTrak™ only</span>
          </label>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Dragon Lore, Asiimov…" className="h-11 pl-9 bg-surface/60" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-11 rounded-md bg-surface/60 border border-border/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="float-asc">Float: Lowest first</option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} listings · live P2P market</p>

          {listings.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}

          {filtered.length === 0 && !listings.isLoading && (
            <div className="rounded-xl glass p-10 text-center text-muted-foreground">
              No listings match your filters.
            </div>
          )}

          {filtered.length >= limit && (
            <div className="text-center">
              <button onClick={() => setLimit((l) => l + 50)} className="rounded-lg glass px-4 py-2 text-sm hover:bg-white/5">Load more</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
