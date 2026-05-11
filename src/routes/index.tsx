import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { StatsRow } from "@/components/sections/StatsRow";
import { SkinCarousel } from "@/components/sections/SkinCarousel";
import { SkinCard } from "@/components/skin/SkinCard";
import { FEATURED, POPULAR, RECENT } from "@/lib/skins-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FragMarket — Live CS2 Skin Market" },
      { name: "description", content: "Discover featured CS2 skins, recently listed items and trending knives — all with verified floats." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Hero />
      <StatsRow />

      <SkinCarousel title="Featured Drops" skins={FEATURED} accent="var(--rarity-rare)" />
      <SkinCarousel title="Popular Skins" skins={POPULAR} accent="var(--rarity-covert)" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-wide">Recently Listed</h2>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live updates
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {RECENT.slice(0, 10).map((s) => (
            <SkinCard key={s.id} skin={s} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
