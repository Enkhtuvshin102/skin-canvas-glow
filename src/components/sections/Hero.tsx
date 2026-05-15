import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";
import { steamImage } from "@/lib/skins-data";

interface HeroProps {
  featuredIcon?: string | null;
  featuredName?: string | null;
}

export function Hero({ featuredIcon, featuredName }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl glass-strong">
      <div className="absolute inset-0">
        {featuredIcon && (
          <img
            src={steamImage(featuredIcon, 512)}
            srcSet={`${steamImage(featuredIcon, 360)} 360w, ${steamImage(featuredIcon, 512)} 512w`}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt={featuredName ?? "Featured listing"}
            loading="eager"
            decoding="async"
            className="absolute right-0 top-1/2 h-[120%] w-[60%] -translate-y-1/2 object-contain opacity-60 drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>
      <div className="relative grid gap-6 p-6 md:p-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5 max-w-xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
            <Flame className="h-3 w-3 text-orange-400" />
            Live P2P market · items stay in seller inventories
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05]">
            Trade premium <span className="gradient-text text-glow">CS2 skins</span> with confidence.
          </h1>
          <p className="text-muted-foreground">
            Real-time pricing, verified floats, sticker overlays and sub-second inspect. Built for collectors and pros.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/marketplace"
              className="group inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-primary hover:opacity-90"
            >
              Browse Marketplace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 rounded-lg glass px-5 py-3 text-sm font-semibold hover:bg-white/5"
            >
              List From Inventory
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
