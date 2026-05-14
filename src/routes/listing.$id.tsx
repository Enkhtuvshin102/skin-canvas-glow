import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { steamImage } from "@/lib/skins-data";
import { FloatBar } from "@/components/skin/FloatBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data: l, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!l) return null;
      const { data: p } = await supabase.from("profiles").select("*").eq("steam_id", l.steam_id).maybeSingle();
      return { listing: l, seller: p };
    },
  });

  if (q.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!q.data) return <p className="text-muted-foreground">Listing not found. <Link to="/marketplace" className="text-primary underline">Back to marketplace</Link></p>;
  const { listing, seller } = q.data;

  const stickers = (listing.stickers as Array<{ name: string; wear: number }>) ?? [];

  return (
    <div className="mx-auto max-w-5xl grid md:grid-cols-[1.2fr_1fr] gap-6">
      <div className="rounded-xl glass p-6">
        <div className="aspect-[4/3] bg-black/30 rounded-lg grid place-items-center overflow-hidden">
          <img src={steamImage(listing.icon_url, 512)} alt={listing.market_hash_name} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase text-muted-foreground">{listing.weapon} · {listing.wear}</p>
          <h1 className="font-display text-2xl font-bold">{listing.stattrak && <span className="text-orange-400">ST™ </span>}{listing.name}</h1>
        </div>
        <div className="mt-4">
          <FloatBar float={Number(listing.float)} wear={listing.wear as any} />
          <p className="mt-2 text-xs text-muted-foreground">Pattern #{listing.pattern} · Asset {listing.asset_id}</p>
        </div>
        {stickers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase text-muted-foreground mb-2">Stickers</p>
            <div className="flex flex-wrap gap-1.5">
              {stickers.map((s, i) => (
                <span key={i} className="rounded bg-white/5 px-2 py-1 text-xs">{s.name} · {Math.round(s.wear * 100)}%</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl glass p-6">
          <p className="text-xs uppercase text-muted-foreground">Price</p>
          <p className="font-display text-4xl font-bold gradient-text">${Number(listing.price_usd).toLocaleString()}</p>
          <span className={`inline-block mt-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${listing.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{listing.status}</span>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              disabled={listing.status !== "active"}
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                window.open(seller?.profile_url ?? `https://steamcommunity.com/profiles/${listing.steam_id}`, "_blank");
                toast.info("Contact seller via Steam to complete the trade");
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Contact seller on Steam
            </Button>
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(listing.inspect_link); toast.success("Inspect link copied"); }}>
              <Eye className="mr-2 h-4 w-4" /> Copy inspect link
            </Button>
          </div>
        </div>

        <div className="rounded-xl glass p-6">
          <p className="text-xs uppercase text-muted-foreground mb-3">Seller</p>
          <a href={seller?.profile_url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3">
            {seller?.avatar_url ? <img src={seller.avatar_url} alt="" className="h-12 w-12 rounded-md" /> : <div className="h-12 w-12 rounded-md gradient-primary" />}
            <div>
              <p className="font-semibold">{seller?.persona ?? "Steam User"}</p>
              <p className="text-xs text-muted-foreground">SteamID {listing.steam_id}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
