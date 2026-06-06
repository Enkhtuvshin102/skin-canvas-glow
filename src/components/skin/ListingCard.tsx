import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { steamImage, type Wear } from "@/lib/skins-data";
import { FloatBar } from "@/components/skin/FloatBar";
import { Stickers } from "@/components/skin/Stickers";
import { BuyDialog } from "@/components/skin/BuyDialog";
import { useAuth } from "@/hooks/use-auth";
import type { Listing } from "@/hooks/use-listings";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  unavailable: "bg-amber-500/20 text-amber-300",
  sold: "bg-blue-500/20 text-blue-300",
  removed: "bg-zinc-500/20 text-zinc-300",
  payment_pending: "bg-purple-500/20 text-purple-300",
};

export function ListingCard({ listing }: { listing: Listing }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);

  const isOwn = user?.id === listing.seller_id;

  const handleBuy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !profile?.steam_id) {
      toast.error("Steam-ээр нэвтэрнэ үү");
      return;
    }
    if (isOwn) {
      toast("Энэ бол таны өөрийн зар");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Link to="/listing/$id" params={{ id: listing.id }} className="block">
        <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-xl glass hover:glow-primary transition-shadow">
          <span className={`absolute top-2 right-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[listing.status] ?? "bg-zinc-500/20"}`}>
            {listing.status}
          </span>
          <div className="relative p-3">
            <div className="aspect-[4/3] bg-black/20 rounded-lg grid place-items-center overflow-hidden">
              <img
                src={steamImage(listing.icon_url ?? "", 256)}
                alt={listing.market_hash_name}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                  {listing.weapon} · {listing.wear}
                </p>
                <h3 className="truncate font-display text-sm font-semibold">
                  {listing.stattrak && <span className="text-orange-400">ST™ </span>}
                  {listing.name}
                </h3>
              </div>
              <FloatBar float={Number(listing.float)} wear={listing.wear as Wear} />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">Seller {listing.steam_id.slice(-6)}</span>
              </div>
              <Stickers stickers={listing.stickers} size="sm" />
              <div className="flex items-end justify-between pt-1">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Price</p>
                  <p className="font-display text-lg font-bold gradient-text">
                    {Number(listing.price_usd).toLocaleString()}₮
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBuy}
                disabled={isOwn || listing.status !== "active"}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg gradient-primary text-primary-foreground py-2 text-xs font-semibold glow-primary hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Худалдаж авах
              </button>
            </div>
          </div>
        </motion.div>
      </Link>
      {user && (
        <BuyDialog
          listing={listing}
          open={open}
          onOpenChange={setOpen}
          buyerId={user.id}
        />
      )}
    </>
  );
}
