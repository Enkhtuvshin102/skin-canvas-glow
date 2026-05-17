import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface StickerData {
  name?: unknown;
  slot?: unknown;
  image?: unknown;
  wear?: unknown;
}

interface Props {
  stickers: unknown;
  size?: "sm" | "md";
  showWear?: boolean;
}

function normalize(raw: unknown): Array<{ name: string; image?: string; wear?: number; slot: number }> {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Array<{ name: string; image?: string; wear?: number; slot: number }> = [];
  raw.forEach((s, i) => {
    if (!s || typeof s !== "object") return;
    const obj = s as StickerData;
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    if (!name) return;
    const slot = typeof obj.slot === "number" && Number.isFinite(obj.slot) ? obj.slot : i;
    const key = `${slot}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    const image = typeof obj.image === "string" && obj.image.length > 0 ? obj.image : undefined;
    const wear = typeof obj.wear === "number" && Number.isFinite(obj.wear) ? obj.wear : undefined;
    out.push({ name, image, wear, slot });
  });
  return out.sort((a, b) => a.slot - b.slot).slice(0, 4);
}

function StickerImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-white/5 text-[8px] uppercase text-muted-foreground">
        {alt.slice(0, 2)}
      </div>
    );
  }
  // Steam economy CDN images
  const url = src.startsWith("http")
    ? src
    : `https://steamcommunity-a.akamaihd.net/economy/image/${src}/96fx96f`;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain"
    />
  );
}

export function Stickers({ stickers, size = "sm", showWear = false }: Props) {
  const list = normalize(stickers);
  if (!list.length) return null;
  const box = size === "sm" ? "h-8 w-8" : "h-12 w-12";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-1.5">
        {list.map((s) => (
          <Tooltip key={`${s.slot}-${s.name}`}>
            <TooltipTrigger asChild>
              <div className={`${box} shrink-0 overflow-hidden rounded bg-black/30 ring-1 ring-white/10`}>
                <StickerImage src={s.image} alt={s.name} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{s.name}</p>
              {showWear && s.wear !== undefined && (
                <p className="text-[10px] opacity-80">{Math.round(s.wear * 100)}% wear</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
