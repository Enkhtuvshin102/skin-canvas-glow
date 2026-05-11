import { motion } from "framer-motion";
import { Activity, DollarSign, Package, Users } from "lucide-react";
import { STATS } from "@/lib/skins-data";

const items = [
  { label: "24h Volume", value: `$${(STATS.volume24h / 1_000_000).toFixed(2)}M`, icon: DollarSign, change: "+12.4%" },
  { label: "Trades (24h)", value: STATS.trades24h.toLocaleString(), icon: Activity, change: "+3.1%" },
  { label: "Active Listings", value: STATS.activeListings.toLocaleString(), icon: Package, change: "+0.8%" },
  { label: "Online Users", value: STATS.onlineUsers.toLocaleString(), icon: Users, change: "live" },
];

export function StatsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl glass p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              {s.change === "live" && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {s.change}
            </p>
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </motion.div>
        );
      })}
    </div>
  );
}
