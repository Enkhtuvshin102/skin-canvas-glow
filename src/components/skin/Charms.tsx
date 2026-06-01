import { memo, useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStickerImageUrl } from "@/components/skin/Stickers";

export interface CharmData {
  name?: unknown;
  slot?: unknown;
  image?: unknown;
}

interface Props {
  charms: unknown;
  size?: "sm" | "md";
}

interface NormalizedCharm {
  name: string;
  image?: string;
  slot: number;
}

function normalize(raw: unknown): NormalizedCharm[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: NormalizedCharm[] = [];
  raw.forEach((c, i) => {
    if (!c || typeof c !== "object") return;
    const obj = c as CharmData;
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    if (!name) return;
    const slot = typeof obj.slot === "number" && Number.isFinite(obj.slot) ? obj.slot : i;
    const key = `${slot}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    const image = typeof obj.image === "string" && obj.image.length > 0 ? obj.image : undefined;
    out.push({ name, image, slot });
  });
  return out.sort((a, b) => a.slot - b.slot);
}

const CharmImage = memo(function CharmImage({ src, alt }: { src?: string; alt: string }) {
  const url = useMemo(() => getStickerImageUrl(src, 128), [src]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

export function Charms({ charms, size = "md" }: Props) {
  const list = useMemo(() => normalize(charms), [charms]);
  if (!list.length) return null;
  const box = size === "sm" ? "h-10 w-10" : "h-14 w-14";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-2">
        {list.map((c) => (
          <Tooltip key={`${c.slot}-${c.name}`}>
            <TooltipTrigger asChild>
              <div className={`${box} shrink-0 overflow-hidden rounded-md bg-black/30 ring-1 ring-white/10`}>
                <CharmImage src={c.image} alt={c.name} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{c.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
