import { memo, useMemo, useState } from "react";
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

interface NormalizedSticker {
  name: string;
  image?: string;
  wear?: number;
  slot: number;
}

const STEAM_CDN = "https://steamcommunity-a.akamaihd.net/economy/image";

/**
 * Build a usable sticker image URL.
 * - Full http(s) URLs pass through.
 * - Otherwise treat the value as a Steam economy image hash and append CDN base + size suffix.
 * - Returns undefined for blank/invalid inputs so the UI can show a clean placeholder.
 */
export function getStickerImageUrl(raw: string | undefined, size = 96): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Steam economy hashes may contain slashes already; never re-encode them.
  return `${STEAM_CDN}/${trimmed}/${size}fx${size}f`;
}

function normalize(raw: unknown): NormalizedSticker[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: NormalizedSticker[] = [];
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

const StickerImage = memo(function StickerImage({ src, alt }: { src?: string; alt: string }) {
  const url = useMemo(() => getStickerImageUrl(src), [src]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (import.meta.env.DEV) {
    // Helpful during development to debug missing sticker images.
    // eslint-disable-next-line no-console
    if (!url) console.debug("[stickers] no image for", alt);
  }

  if (!url || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-white/5 text-[8px] font-semibold uppercase text-muted-foreground">
        {alt.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      style={{ opacity: loaded ? 1 : 0, transition: "opacity 200ms ease-out" }}
      className="h-full w-full object-contain"
    />
  );
});

export function Stickers({ stickers, size = "sm", showWear = false }: Props) {
  const list = useMemo(() => normalize(stickers), [stickers]);
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
