import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { steamImage } from "@/lib/skins-data";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { updateListingPrice, removeListing, relistListing, revalidateMyListings } from "@/lib/listings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/my-listings")({
  head: () => ({ meta: [{ title: "My Listings — FragMarket" }] }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const revalidate = useServerFn(revalidateMyListings);
  const updatePrice = useServerFn(updateListingPrice);
  const remove = useServerFn(removeListing);
  const relist = useServerFn(relistListing);

  const q = useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) revalidate().then(() => qc.invalidateQueries({ queryKey: ["my-listings"] })).catch(() => {});
  }, [user, revalidate, qc]);

  const updateM = useMutation({
    mutationFn: (v: { id: string; price: number }) => updatePrice({ data: { id: v.id, price_usd: v.price } }),
    onSuccess: () => { toast.success("Price updated"); qc.invalidateQueries({ queryKey: ["my-listings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Listing removed"); qc.invalidateQueries({ queryKey: ["my-listings"] }); },
  });
  const relistM = useMutation({
    mutationFn: (v: { id: string; price: number }) => relist({ data: { id: v.id, price_usd: v.price } }),
    onSuccess: () => { toast.success("Relisted"); qc.invalidateQueries({ queryKey: ["my-listings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center py-20">
        <h1 className="font-display text-2xl font-bold mb-2">Sign in to manage listings</h1>
        <Button asChild className="gradient-primary text-primary-foreground">
          <a href="/api/public/steam/login">Sign in with Steam</a>
        </Button>
      </div>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <h1 className="font-display text-3xl font-bold mb-4">My Listings</h1>
      {q.isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      {rows.length === 0 && !q.isLoading && (
        <div className="rounded-xl glass p-10 text-center text-muted-foreground">
          No listings yet. Head to your <a className="text-primary underline" href="/inventory">inventory</a> to list items.
        </div>
      )}
      {rows.map((l) => <Row key={l.id} listing={l} onUpdate={(p) => updateM.mutate({ id: l.id, price: p })} onRemove={() => removeM.mutate(l.id)} onRelist={(p) => relistM.mutate({ id: l.id, price: p })} />)}
    </div>
  );
}

function Row({ listing, onUpdate, onRemove, onRelist }: { listing: any; onUpdate: (p: number) => void; onRemove: () => void; onRelist: (p: number) => void }) {
  const [price, setPrice] = useState(String(listing.price_usd));
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-300",
    sold: "bg-blue-500/20 text-blue-300",
    unavailable: "bg-amber-500/20 text-amber-300",
    removed: "bg-zinc-500/20 text-zinc-300",
  };
  return (
    <div className="rounded-xl glass p-3 flex items-center gap-4">
      <img src={steamImage(listing.icon_url, 128)} alt="" className="h-16 w-20 object-contain bg-black/20 rounded" loading="lazy" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase text-muted-foreground">{listing.weapon} · {listing.wear} · float {Number(listing.float).toFixed(4)}</p>
        <p className="font-semibold truncate">{listing.stattrak && <span className="text-orange-400">ST™ </span>}{listing.name}</p>
        <span className={`inline-block mt-1 rounded px-2 py-0.5 text-[10px] uppercase font-bold ${statusColors[listing.status]}`}>{listing.status}</span>
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-24 h-9" />
        {listing.status === "active" && <Button size="sm" onClick={() => onUpdate(Number(price))}>Save</Button>}
        {listing.status === "unavailable" && <Button size="sm" onClick={() => onRelist(Number(price))} className="gradient-primary text-primary-foreground">Relist</Button>}
        {listing.status !== "removed" && <Button size="sm" variant="ghost" onClick={onRemove}>Remove</Button>}
      </div>
    </div>
  );
}
