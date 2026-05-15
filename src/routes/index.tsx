import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { StatsRow } from "@/components/sections/StatsRow";
import { ListingCard } from "@/components/skin/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useListings } from "@/hooks/use-listings";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FragMarket — Live CS2 Skin Market" },
      { name: "description", content: "Live P2P CS2 skin listings. Verified floats, stickers, inspect links — items stay in seller Steam inventories." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: listings, isLoading } = useListings({ limit: 8, statuses: ["active"] });
  const featured = listings?.[0];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Hero featuredIcon={featured?.icon_url} featuredName={featured?.market_hash_name} />
      <StatsRow />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-wide">Latest Listings</h2>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live updates
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl glass p-12 text-center space-y-4">
      <div className="mx-auto grid place-items-center h-12 w-12 rounded-full gradient-primary glow-primary">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">No listings yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The marketplace is fresh and waiting. Be the first to list an item from your Steam inventory.
        </p>
      </div>
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-primary hover:opacity-90"
      >
        Be the first to list an item
      </Link>
    </div>
  );
}
