import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, ShieldCheck, TrendingUp } from "lucide-react";
import { SkinCard } from "@/components/skin/SkinCard";
import { SKINS } from "@/lib/skins-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Inventory — FragMarket" },
      { name: "description", content: "Showcase your CS2 inventory, track market value and manage your listings." },
    ],
  }),
  component: ProfilePage,
});

const inventory = SKINS.slice(0, 16);
const totalValue = inventory.reduce((a, b) => a + b.price, 0);

const tradingStats = [
  { label: "Total Trades", value: "142" },
  { label: "Inventory Value", value: `$${totalValue.toLocaleString()}` },
  { label: "Profit (30d)", value: "+$1,284", positive: true },
  { label: "Reputation", value: "5.0 / 5.0" },
];

function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-strong">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 80% at 20% 0%, oklch(0.7 0.21 255 / 0.5), transparent 60%), radial-gradient(50% 70% at 80% 100%, oklch(0.68 0.27 305 / 0.5), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col md:flex-row gap-6 p-6 md:p-8">
          <div className="h-24 w-24 rounded-2xl gradient-primary glow-primary grid place-items-center font-display text-3xl font-bold text-primary-foreground">
            KZ
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold">kzero</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-xs text-fuchsia-300">
                <Award className="h-3 w-3" /> Lvl 42
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Joined March 2021 · Trader since the Vertigo era. Specializing in knives and stickered AKs.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tradingStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-xl glass p-3"
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 font-display text-xl font-bold ${s.positive ? "text-emerald-400" : ""}`}>
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trading activity */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl glass p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Trading Activity</h2>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <svg viewBox="0 0 600 160" className="mt-4 h-40 w-full">
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.21 255)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="oklch(0.68 0.27 305)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,120 C60,90 90,140 150,100 C210,60 240,110 300,80 C360,50 390,90 450,60 C510,30 540,70 600,40 L600,160 L0,160 Z"
              fill="url(#g)"
            />
            <path
              d="M0,120 C60,90 90,140 150,100 C210,60 240,110 300,80 C360,50 390,90 450,60 C510,30 540,70 600,40"
              stroke="oklch(0.7 0.21 255)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
        <div className="rounded-xl glass p-5 space-y-3">
          <h2 className="font-display text-lg font-bold">Recent Trades</h2>
          {SKINS.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.fullName}</p>
                <p className="text-[11px] text-muted-foreground">{s.listedAt} · {s.wear}</p>
              </div>
              <p className="font-display font-bold gradient-text">${s.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Inventory */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-wide">Inventory Showcase</h2>
          <p className="text-xs text-muted-foreground">{inventory.length} items</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {inventory.map((s) => (
            <SkinCard key={s.id} skin={s} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
