export type Wear = "FN" | "MW" | "FT" | "WW" | "BS";
export type Rarity =
  | "consumer" | "industrial" | "milspec" | "restricted"
  | "classified" | "covert" | "rare";

export interface Sticker {
  name: string;
  wear?: number; // 0..1
  color?: string;
}

export interface Skin {
  id: string;
  name: string;        // e.g. "Dragon Lore"
  weapon: string;      // e.g. "AWP"
  fullName: string;    // e.g. "AWP | Dragon Lore"
  float: number;       // 0..1
  pattern: number;     // 0..1000
  wear: Wear;
  price: number;       // USD
  rarity: Rarity;
  stickers?: Sticker[];
  stattrak?: boolean;
  souvenir?: boolean;
  doppler?: string;       // phase
  fade?: number;          // %
  caseHardenedTier?: string; // Tier 1 / Blue Gem
  seller: string;
  listedAt: string;
  // visual
  hue: number;
  hue2: number;
  inspectLink: string;
}

const WEARS: { wear: Wear; min: number; max: number }[] = [
  { wear: "FN", min: 0.0, max: 0.07 },
  { wear: "MW", min: 0.07, max: 0.15 },
  { wear: "FT", min: 0.15, max: 0.38 },
  { wear: "WW", min: 0.38, max: 0.45 },
  { wear: "BS", min: 0.45, max: 1.0 },
];

export function wearLabel(w: Wear) {
  return { FN: "Factory New", MW: "Minimal Wear", FT: "Field-Tested", WW: "Well-Worn", BS: "Battle-Scarred" }[w];
}
export function wearFromFloat(f: number): Wear {
  return (WEARS.find((w) => f >= w.min && f < w.max)?.wear ?? "BS");
}
export function wearColorVar(w: Wear) {
  return ({ FN: "var(--float-fn)", MW: "var(--float-mw)", FT: "var(--float-ft)", WW: "var(--float-ww)", BS: "var(--float-bs)" })[w];
}

export const RARITY_LABEL: Record<Rarity, string> = {
  consumer: "Consumer", industrial: "Industrial", milspec: "Mil-Spec",
  restricted: "Restricted", classified: "Classified", covert: "Covert", rare: "★ Rare Special",
};

const SELLERS = ["NeonTrader", "AceFloat", "PrimeMarket", "VertigoOG", "SkyDealer", "FragMaster", "OverpassPro", "MirageKing"];

const SKIN_DEFS: Array<Partial<Skin> & { name: string; weapon: string; rarity: Rarity; basePrice: number; hue: number; hue2: number; doppler?: string; fade?: number; caseHardenedTier?: string; }> = [
  { name: "Dragon Lore", weapon: "AWP", rarity: "covert", basePrice: 12500, hue: 45, hue2: 25 },
  { name: "Gungnir", weapon: "AWP", rarity: "covert", basePrice: 9800, hue: 220, hue2: 260 },
  { name: "Wildfire", weapon: "AWP", rarity: "covert", basePrice: 320, hue: 15, hue2: 350 },
  { name: "Asiimov", weapon: "AWP", rarity: "covert", basePrice: 145, hue: 30, hue2: 0 },
  { name: "Neo-Noir", weapon: "AWP", rarity: "covert", basePrice: 95, hue: 320, hue2: 280 },
  { name: "Fade", weapon: "Glock-18", rarity: "restricted", basePrice: 480, hue: 290, hue2: 50, fade: 95 },
  { name: "Doppler", weapon: "★ Karambit", rarity: "rare", basePrice: 2400, hue: 280, hue2: 200, doppler: "Phase 2" },
  { name: "Doppler", weapon: "★ Butterfly Knife", rarity: "rare", basePrice: 3100, hue: 200, hue2: 320, doppler: "Sapphire" },
  { name: "Marble Fade", weapon: "★ M9 Bayonet", rarity: "rare", basePrice: 1850, hue: 0, hue2: 220 },
  { name: "Case Hardened", weapon: "★ Karambit", rarity: "rare", basePrice: 4200, hue: 220, hue2: 35, caseHardenedTier: "Blue Gem T1" },
  { name: "Slaughter", weapon: "★ Bayonet", rarity: "rare", basePrice: 580, hue: 350, hue2: 320 },
  { name: "Howl", weapon: "M4A4", rarity: "rare", basePrice: 5400, hue: 25, hue2: 0 },
  { name: "Asiimov", weapon: "M4A1-S", rarity: "covert", basePrice: 110, hue: 30, hue2: 350 },
  { name: "Hyper Beast", weapon: "M4A1-S", rarity: "covert", basePrice: 95, hue: 180, hue2: 320 },
  { name: "Printstream", weapon: "M4A1-S", rarity: "covert", basePrice: 230, hue: 0, hue2: 230 },
  { name: "Fire Serpent", weapon: "AK-47", rarity: "covert", basePrice: 720, hue: 90, hue2: 25 },
  { name: "Vulcan", weapon: "AK-47", rarity: "covert", basePrice: 165, hue: 200, hue2: 15 },
  { name: "Redline", weapon: "AK-47", rarity: "classified", basePrice: 28, hue: 0, hue2: 270 },
  { name: "Neon Rider", weapon: "AK-47", rarity: "covert", basePrice: 78, hue: 290, hue2: 200 },
  { name: "Asiimov", weapon: "P90", rarity: "covert", basePrice: 38, hue: 30, hue2: 0 },
  { name: "Cyrex", weapon: "USP-S", rarity: "classified", basePrice: 22, hue: 0, hue2: 200 },
  { name: "Kill Confirmed", weapon: "USP-S", rarity: "covert", basePrice: 95, hue: 60, hue2: 0 },
  { name: "Printstream", weapon: "Desert Eagle", rarity: "covert", basePrice: 145, hue: 0, hue2: 230 },
  { name: "Blaze", weapon: "Desert Eagle", rarity: "restricted", basePrice: 480, hue: 30, hue2: 10 },
];

let _seed = 1337;
function rand() { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; }

function makeStickers(): Sticker[] | undefined {
  if (rand() < 0.55) return undefined;
  const pool = ["Katowice 2014 | Titan (Holo)", "IEM Cologne 2023 | NAVI (Gold)", "Stockholm 2021 | s1mple", "Crown (Foil)", "Howling Dawn", "Katowice 2015 | TSM (Holo)"];
  const n = 1 + Math.floor(rand() * 4);
  return Array.from({ length: n }, () => ({
    name: pool[Math.floor(rand() * pool.length)],
    wear: Math.round(rand() * 100) / 100,
  }));
}

function relativeTime(i: number) {
  const mins = Math.floor(rand() * 240) + i;
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export const SKINS: Skin[] = SKIN_DEFS.flatMap((def, i) => {
  const variants = 2 + Math.floor(rand() * 3);
  return Array.from({ length: variants }, (_, v) => {
    const float = +(rand() * (def.name === "Dragon Lore" ? 0.3 : 1)).toFixed(6);
    const wear = wearFromFloat(float);
    const wearMul = wear === "FN" ? 1.6 : wear === "MW" ? 1.15 : wear === "FT" ? 1 : wear === "WW" ? 0.7 : 0.55;
    const stattrak = rand() < 0.18;
    const price = Math.round(def.basePrice * wearMul * (stattrak ? 1.4 : 1) * (0.85 + rand() * 0.4));
    return {
      id: `${i}-${v}`,
      name: def.name,
      weapon: def.weapon,
      fullName: `${stattrak ? "StatTrak™ " : ""}${def.weapon} | ${def.name}`,
      float,
      pattern: Math.floor(rand() * 1000),
      wear,
      price,
      rarity: def.rarity,
      stickers: makeStickers(),
      stattrak,
      doppler: def.doppler,
      fade: def.fade ? Math.max(80, Math.min(100, def.fade + Math.floor(rand() * 8 - 4))) : undefined,
      caseHardenedTier: def.caseHardenedTier,
      seller: SELLERS[Math.floor(rand() * SELLERS.length)],
      listedAt: relativeTime(i + v),
      hue: def.hue,
      hue2: def.hue2,
      inspectLink: `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${100000 + i * 17 + v}D${Math.floor(rand() * 1e16)}`,
    } as Skin;
  });
});

export const FEATURED = SKINS.filter((s) => s.price > 1500).slice(0, 8);
export const RECENT = [...SKINS].sort(() => rand() - 0.5).slice(0, 12);
export const POPULAR = SKINS.filter((s) => ["Asiimov", "Doppler", "Fade", "Neon Rider", "Hyper Beast", "Printstream", "Vulcan", "Redline"].includes(s.name)).slice(0, 10);

export const STATS = {
  volume24h: 4_281_572,
  trades24h: 18_402,
  activeListings: 124_589,
  onlineUsers: 9_421,
};
