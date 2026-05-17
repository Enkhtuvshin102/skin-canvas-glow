import { motion } from "framer-motion";
import { Eye, ShoppingCart, Sticker as StickerIcon } from "lucide-react";
import { SkinImage } from "./SkinImage";
import { FloatBar } from "./FloatBar";
import { RARITY_LABEL, type Skin } from "@/lib/skins-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  skin: Skin;
  compact?: boolean;
}

const rarityVar: Record<Skin["rarity"], string> = {
  consumer: "var(--rarity-consumer)",
  industrial: "var(--rarity-industrial)",
  milspec: "var(--rarity-milspec)",
  restricted: "var(--rarity-restricted)",
  classified: "var(--rarity-classified)",
  covert: "var(--rarity-covert)",
  rare: "var(--rarity-rare)",
};

export function SkinCard({ skin, compact }: Props) {
  const rarityColor = rarityVar[skin.rarity];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative overflow-hidden rounded-xl glass hover:glow-primary transition-shadow"
      style={{ borderTop: `2px solid ${rarityColor}` }}
    >
      {/* rarity glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${rarityColor}, transparent)` }}
      />

      <div className="relative p-3">
        <SkinImage skin={skin} size={compact ? "sm" : "md"} />

        <div className="mt-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                {skin.weapon} · {RARITY_LABEL[skin.rarity]}
              </p>
              <h3 className="truncate font-display text-sm font-semibold">
                {skin.stattrak && <span className="text-orange-400">ST™ </span>}
                {skin.name}
              </h3>
            </div>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: `${rarityColor}20`, color: rarityColor }}
            >
              {skin.wear}
            </span>
          </div>

          <FloatBar float={skin.float} wear={skin.wear} />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Pattern #{skin.pattern}</span>
            {skin.stickers && (
              <span className="flex items-center gap-1">
                <StickerIcon className="h-3 w-3" />
                {skin.stickers.length}
              </span>
            )}
          </div>

          {skin.stickers && (
            <div className="flex flex-wrap gap-1">
              {skin.stickers.map((s, i) => (
                <span
                  key={i}
                  title={`${s.name} · ${Math.round((s.wear ?? 0) * 100)}% wear`}
                  className="truncate rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {s.name.split(" | ")[0]}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between pt-1">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Price</p>
              <p className="font-display text-lg font-bold gradient-text">
                ${skin.price.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => toast("Inspect link copied", { description: skin.fullName })}
                title="Inspect in-game"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => toast.success("Added to cart", { description: skin.fullName })}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
