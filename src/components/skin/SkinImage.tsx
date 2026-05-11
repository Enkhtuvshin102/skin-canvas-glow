import { motion } from "framer-motion";
import { Crosshair, Sparkles, Zap } from "lucide-react";
import type { Skin } from "@/lib/skins-data";

interface Props {
  skin: Skin;
  size?: "sm" | "md" | "lg";
}

/**
 * Stylized skin "image" — a layered, glossy gradient plate that suggests
 * a CS2 skin without using copyrighted assets.
 */
export function SkinImage({ skin, size = "md" }: Props) {
  const heights = { sm: "h-28", md: "h-40", lg: "h-56" }[size];
  const isKnife = skin.weapon.startsWith("★");
  const Icon = isKnife ? Sparkles : skin.doppler ? Zap : Crosshair;

  return (
    <div
      className={`relative ${heights} w-full overflow-hidden rounded-lg`}
      style={{
        background: `radial-gradient(120% 80% at 30% 30%, hsl(${skin.hue} 90% 55% / 0.55), transparent 60%),
                     radial-gradient(120% 80% at 80% 70%, hsl(${skin.hue2} 90% 55% / 0.55), transparent 60%),
                     linear-gradient(135deg, hsl(${skin.hue} 40% 12%), hsl(${skin.hue2} 40% 8%))`,
      }}
    >
      {/* glossy sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 45%, transparent 60%)",
        }}
      />
      {/* pattern lines */}
      <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 200 100" preserveAspectRatio="none">
        <defs>
          <pattern id={`p-${skin.id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform={`rotate(${skin.pattern % 90})`}>
            <path d="M0 5h10" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="100" fill={`url(#p-${skin.id})`} />
      </svg>

      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Icon className="h-12 w-12 text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
      </motion.div>

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
