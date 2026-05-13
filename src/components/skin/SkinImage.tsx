import { useState } from "react";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { steamImage, type Skin } from "@/lib/skins-data";

interface Props {
  skin: Skin;
  size?: "sm" | "md" | "lg";
}

/**
 * Renders a CS2 skin using Steam's CDN icon (icon_url_large preferred).
 * Includes:
 *  - Loading skeleton shimmer
 *  - Graceful fallback placeholder if the image fails to load
 *  - Native lazy loading + async decoding
 *  - Responsive srcSet using Steam's /{size}fx{size}f resizing
 */
export function SkinImage({ skin, size = "md" }: Props) {
  const heights = { sm: "h-28", md: "h-40", lg: "h-56" }[size];
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const has = !!skin.icon;
  const src = has ? steamImage(skin.icon, 360) : "";
  const srcSet = has
    ? `${steamImage(skin.icon, 256)} 256w, ${steamImage(skin.icon, 360)} 360w, ${steamImage(skin.icon, 512)} 512w`
    : undefined;
  const sizes = size === "sm" ? "240px" : size === "lg" ? "560px" : "360px";

  return (
    <div
      className={`relative ${heights} w-full overflow-hidden rounded-lg`}
      style={{
        background: `radial-gradient(120% 80% at 30% 30%, hsl(${skin.hue} 90% 55% / 0.35), transparent 60%),
                     radial-gradient(120% 80% at 80% 70%, hsl(${skin.hue2} 90% 55% / 0.35), transparent 60%),
                     linear-gradient(135deg, hsl(${skin.hue} 40% 10%), hsl(${skin.hue2} 40% 6%))`,
      }}
    >
      {/* Loading skeleton shimmer */}
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 via-white/10 to-white/5" />
      )}

      {/* Fallback placeholder */}
      {(errored || !has) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/50">
          <ImageOff className="h-8 w-8" />
          <span className="text-[10px] uppercase tracking-wider">No image</span>
        </div>
      )}

      {/* Steam CDN image */}
      {has && !errored && (
        <motion.img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={skin.fullName}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.96 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 m-auto h-full w-full object-contain p-3 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        />
      )}

      {/* Glossy sheen overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 45%, transparent 60%)",
        }}
      />

      {skin.stattrak && (
        <span className="absolute left-2 top-2 rounded bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          StatTrak™
        </span>
      )}
      {skin.doppler && (
        <span className="absolute right-2 top-2 rounded bg-fuchsia-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
          {skin.doppler}
        </span>
      )}
      {skin.fade && (
        <span className="absolute right-2 top-2 rounded bg-pink-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
          {skin.fade}% Fade
        </span>
      )}
      {skin.caseHardenedTier && (
        <span className="absolute right-2 top-2 rounded bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
          {skin.caseHardenedTier}
        </span>
      )}
    </div>
  );
}
