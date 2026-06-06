import { useEffect, useState } from "react";
import { Copy, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { steamImage, type Wear } from "@/lib/skins-data";
import { FloatBar } from "@/components/skin/FloatBar";
import type { Listing } from "@/hooks/use-listings";

interface SellerProfile {
  id: string;
  steam_id: string;
  persona: string | null;
  avatar_url: string | null;
  profile_url: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
}

interface Props {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyerId: string;
}

export function BuyDialog({ listing, open, onOpenChange, buyerId }: Props) {
  const qc = useQueryClient();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setDone(false);
      setSeller(null);
      return;
    }
    setLoadingSeller(true);
    supabase
      .from("profiles")
      .select("id, steam_id, persona, avatar_url, profile_url, bank_name, account_number, account_name")
      .eq("id", listing.seller_id)
      .maybeSingle()
      .then(({ data }) => {
        setSeller(data as SellerProfile | null);
        setLoadingSeller(false);
      });
  }, [open, listing.seller_id]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Хууллаа");
    } catch {
      toast.error("Хуулж чадсангүй");
    }
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      const { error: txErr } = await supabase.from("transactions").insert({
        listing_id: listing.id,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        price: listing.price_usd,
        status: "payment_pending",
      });
      if (txErr) throw txErr;

      const { error: lErr } = await supabase
        .from("listings")
        .update({ status: "payment_pending" })
        .eq("id", listing.id);
      if (lErr) throw lErr;

      qc.invalidateQueries({ queryKey: ["listings"] });
      setDone(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const price = Number(listing.price_usd).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass border-border/60">
        {done ? (
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <DialogTitle className="font-display text-xl">Төлбөр илгээгдлээ</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Төлбөр илгээсний дараа худалдагч Steam trade илгээнэ.
              </p>
            </div>
            {seller?.profile_url && (
              <a
                href={seller.profile_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary"
              >
                Худалдагчийн Steam профайл
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Хаах
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Худалдан авалт баталгаажуулах</DialogTitle>
              <DialogDescription>
                Худалдагчийн данс руу төлбөрөө шилжүүлээд баталгаажуулна уу.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 rounded-lg bg-surface/40 p-3">
              <div className="h-20 w-20 shrink-0 rounded-md bg-black/30 grid place-items-center overflow-hidden">
                <img
                  src={steamImage(listing.icon_url ?? "", 192)}
                  alt={listing.market_hash_name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {listing.weapon} · {listing.wear}
                </p>
                <h4 className="truncate font-display text-sm font-semibold">
                  {listing.stattrak && <span className="text-orange-400">ST™ </span>}
                  {listing.name}
                </h4>
                <div className="mt-1.5">
                  <FloatBar float={Number(listing.float)} wear={listing.wear as Wear} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Float: <span className="font-mono text-foreground">{Number(listing.float).toFixed(6)}</span>
                </p>
              </div>
            </div>

            <div className="rounded-lg glass p-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Худалдагч</span>
                {loadingSeller ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="font-semibold">{seller?.persona ?? `Steam ${listing.steam_id.slice(-6)}`}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Үнэ</span>
                <span className="font-display text-lg font-bold gradient-text">{price}₮</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-surface/40 p-3 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Шилжүүлгийн мэдээлэл</p>
              {loadingSeller ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : seller?.bank_name || seller?.account_number || seller?.account_name ? (
                <>
                  <Row label="🏦 Банк" value={seller?.bank_name ?? "—"} />
                  <Row
                    label="💳 Данс"
                    value={seller?.account_number ?? "—"}
                    onCopy={seller?.account_number ? () => copy(seller.account_number!) : undefined}
                  />
                  <Row label="👤 Эзэмшигч" value={seller?.account_name ?? "—"} />
                </>
              ) : (
                <p className="text-xs text-amber-300">
                  Худалдагч банкны мэдээллээ оруулаагүй байна. Худалдагчтай шууд холбогдоно уу.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={confirming}
              >
                Болих
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirming || loadingSeller}
                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Төлбөр илгээлээ"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-sm truncate">{value}</span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded p-1 hover:bg-white/10 text-muted-foreground hover:text-foreground"
            aria-label="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
