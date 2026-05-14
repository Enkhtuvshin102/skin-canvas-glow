import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { getMyInventory } from "@/lib/inventory.functions";
import { createListing } from "@/lib/listings.functions";
import { steamImage } from "@/lib/skins-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "My Inventory — FragMarket" }] }),
  component: InventoryPage,
});

type Item = {
  asset_id: string; market_hash_name: string; name: string; weapon: string;
  wear: string; icon_url: string; rarity: string; stattrak: boolean;
  tradable: boolean; inspect_link: string; listed?: boolean;
};

function InventoryPage() {
  const { user, loading } = useAuth();
  const fetchInv = useServerFn(getMyInventory);
  const qc = useQueryClient();

  const inv = useQuery({
    queryKey: ["inventory", user?.id],
    queryFn: () => fetchInv(),
    enabled: !!user,
    staleTime: 60_000,
  });

  if (loading) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center py-20">
        <h1 className="font-display text-2xl font-bold mb-2">Sign in to see your inventory</h1>
        <p className="text-muted-foreground mb-6">We use Steam OpenID — your items stay in your Steam account.</p>
        <Button asChild className="gradient-primary text-primary-foreground">
          <a href="/api/public/steam/login">Sign in with Steam</a>
        </Button>
      </div>
    );
  }

  const items = (inv.data?.items ?? []) as Item[];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Steam Inventory</h1>
          <p className="text-sm text-muted-foreground">{items.length} CS2 items · live from Steam</p>
        </div>
      </div>

      {inv.data?.error && (
        <div className="mb-4 rounded-xl glass p-4 text-sm text-destructive">{inv.data.error}</div>
      )}

      {inv.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((it) => (
            <InventoryCard key={it.asset_id} item={it} onListed={() => qc.invalidateQueries({ queryKey: ["inventory"] })} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryCard({ item, onListed }: { item: Item; onListed: () => void }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const create = useServerFn(createListing);
  const m = useMutation({
    mutationFn: () => create({ data: { asset_id: item.asset_id, price_usd: Number(price) } }),
    onSuccess: () => {
      toast.success("Listing created", { description: item.market_hash_name });
      setOpen(false); setPrice(""); onListed();
    },
    onError: (e: Error) => toast.error("Could not list", { description: e.message }),
  });

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative rounded-xl glass p-3 overflow-hidden"
    >
      {item.listed && (
        <span className="absolute top-2 right-2 z-10 rounded bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-bold uppercase">
          Listed
        </span>
      )}
      <div className="aspect-[4/3] bg-black/20 rounded-lg grid place-items-center overflow-hidden">
        <img
          src={steamImage(item.icon_url, 256)}
          alt={item.market_hash_name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="mt-2 min-h-[2.5rem]">
        <p className="text-[10px] uppercase text-muted-foreground truncate">{item.weapon} · {item.wear}</p>
        <p className="text-sm font-semibold truncate">
          {item.stattrak && <span className="text-orange-400">ST™ </span>}
          {item.name}
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mt-2 w-full gradient-primary text-primary-foreground" disabled={item.listed || !item.tradable}>
            {item.listed ? "Already listed" : !item.tradable ? "Not tradable" : "List for sale"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>List {item.market_hash_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm">Price (USD)</label>
            <Input type="number" min={0.01} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 124.99" />
            <p className="text-xs text-muted-foreground">Item stays in your Steam inventory. Buyers contact you via Steam to complete the trade.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => m.mutate()} disabled={!price || m.isPending} className="gradient-primary text-primary-foreground">
              {m.isPending ? "Listing…" : "Confirm listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
