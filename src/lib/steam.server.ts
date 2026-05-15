// Server-only Steam helpers (OpenID verify, profile fetch, inventory fetch).
// Never import from client code.

const OPENID_NS = "http://specs.openid.net/auth/2.0";

export function buildOpenIdRedirect(returnTo: string, realm: string) {
  const params = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

/**
 * Verify the OpenID response by re-posting params to Steam with mode=check_authentication.
 * Returns the SteamID64 on success, or null.
 */
export async function verifyOpenIdResponse(searchParams: URLSearchParams): Promise<string | null> {
  // Build verification body
  const body = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) body.append(k, v);
  body.set("openid.mode", "check_authentication");

  const res = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  if (!/is_valid\s*:\s*true/i.test(text)) return null;

  const claimed = searchParams.get("openid.claimed_id") ?? "";
  const m = claimed.match(/\/openid\/id\/(\d{17})$/);
  return m ? m[1] : null;
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

export async function fetchSteamProfile(steamId: string): Promise<SteamProfile | null> {
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) throw new Error("STEAM_WEB_API_KEY missing");
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { response?: { players?: SteamProfile[] } };
  return json.response?.players?.[0] ?? null;
}

export interface Sticker {
  name: string;
}

export interface InventoryItem {
  asset_id: string;
  market_hash_name: string;
  name: string;
  weapon: string;
  wear: string;
  icon_url: string;
  rarity: string;
  stattrak: boolean;
  tradable: boolean;
  inspect_link: string;
  stickers: Sticker[];
}

const WEAR_RE = /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/;
const WEAR_SHORT: Record<string, string> = {
  "Factory New": "FN",
  "Minimal Wear": "MW",
  "Field-Tested": "FT",
  "Well-Worn": "WW",
  "Battle-Scarred": "BS",
};

export async function fetchSteamInventory(steamId: string): Promise<InventoryItem[]> {
  const url = `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=2000`;
  const res = await fetch(url, { headers: { "User-Agent": "FragMarket/1.0" } });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Steam inventory is private. Set inventory to public on steamcommunity.com.");
    throw new Error(`Steam inventory fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    assets?: Array<{ assetid: string; classid: string; instanceid: string }>;
    descriptions?: Array<{
      classid: string;
      instanceid: string;
      market_hash_name: string;
      name: string;
      icon_url: string;
      tradable: number;
      tags?: Array<{ category: string; localized_tag_name: string; internal_name?: string }>;
      actions?: Array<{ link: string; name: string }>;
      type?: string;
    }>;
  };
  if (!data.assets || !data.descriptions) return [];

  const descMap = new Map<string, (typeof data.descriptions)[number]>();
  for (const d of data.descriptions) descMap.set(`${d.classid}_${d.instanceid}`, d);

  const items: InventoryItem[] = [];
  for (const a of data.assets) {
    const d = descMap.get(`${a.classid}_${a.instanceid}`);
    if (!d) continue;
    // Filter to weapon skins only (have an exterior tag)
    const wearTag = d.tags?.find((t) => t.category === "Exterior")?.localized_tag_name;
    if (!wearTag) continue;
    const weaponTag =
      d.tags?.find((t) => t.category === "Weapon")?.localized_tag_name ??
      d.market_hash_name.split(" | ")[0]?.replace(/^StatTrak™\s*/, "") ??
      "Unknown";
    const rarityTag = d.tags?.find((t) => t.category === "Rarity")?.internal_name?.replace("Rarity_", "").toLowerCase() ?? "classified";
    const stattrak = /StatTrak™/i.test(d.market_hash_name);
    const namePart = d.market_hash_name.split(" | ")[1]?.replace(WEAR_RE, "").trim() ?? d.name;

    const inspectAction = d.actions?.find((act) => act.link?.includes("+csgo_econ_action_preview"));
    const inspect_link = inspectAction
      ? inspectAction.link.replace("%owner_steamid%", steamId).replace("%assetid%", a.assetid)
      : "";

    items.push({
      asset_id: a.assetid,
      market_hash_name: d.market_hash_name,
      name: namePart,
      weapon: weaponTag,
      wear: WEAR_SHORT[wearTag] ?? "FT",
      icon_url: d.icon_url,
      rarity: rarityTag,
      stattrak,
      tradable: d.tradable === 1,
      inspect_link,
    });
  }
  return items;
}

/** Deterministic hash → fake float/pattern from inspect link / asset id. */
export function mockInspect(seed: string, wear: string): { float: number; pattern: number; stickers: Array<{ name: string; wear: number }> } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (h >>> 0) / 0xffffffff;
  // Wear-bounded float
  const ranges: Record<string, [number, number]> = {
    FN: [0, 0.07], MW: [0.07, 0.15], FT: [0.15, 0.38], WW: [0.38, 0.45], BS: [0.45, 1],
  };
  const [lo, hi] = ranges[wear] ?? [0.15, 0.38];
  const float = +(lo + u * (hi - lo)).toFixed(6);
  const pattern = Math.floor(u * 1000);
  const stickerPool = [
    "Katowice 2014 | Titan (Holo)",
    "IEM Cologne 2023 | NAVI (Gold)",
    "Stockholm 2021 | s1mple",
    "Crown (Foil)",
    "Howling Dawn",
  ];
  const stickerCount = Math.floor(u * 4); // 0..3
  const stickers = Array.from({ length: stickerCount }, (_, i) => ({
    name: stickerPool[(Math.floor(u * 1000) + i) % stickerPool.length],
    wear: +(((u * (i + 1)) % 1)).toFixed(2),
  }));
  return { float, pattern, stickers };
}
