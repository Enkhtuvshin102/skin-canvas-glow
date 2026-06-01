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
  slot: number;
  image?: string;
}

export interface Charm {
  name: string;
  slot: number;
  image?: string;
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
  charms: Charm[];
}


type SteamInventoryDescription = {
  classid: string;
  instanceid: string;
  market_hash_name: string;
  name: string;
  icon_url: string;
  tradable: number;
  tags?: Array<{ category: string; localized_tag_name: string; internal_name?: string }>;
  actions?: Array<{ link: string; name: string }>;
  descriptions?: Array<{ type?: string; value?: string; name?: string }>;
  type?: string;
};

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
    descriptions?: SteamInventoryDescription[];
  };
  if (!data.assets || !data.descriptions) return [];

  const descMap = new Map<string, (typeof data.descriptions)[number]>();
  for (const d of data.descriptions) descMap.set(`${d.classid}_${d.instanceid}`, d);

  const items: InventoryItem[] = [];
  for (const a of data.assets) {
    const d = descMap.get(`${a.classid}_${a.instanceid}`);
    if (!d) continue;
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
    const rawInspect = inspectAction
      ? inspectAction.link.replace("%owner_steamid%", steamId).replace("%assetid%", a.assetid)
      : "";
    const inspect_link = isValidInspectLink(rawInspect) ? rawInspect : "";

    const stickers = parseStickers(d.descriptions);
    const charms = parseCharms(d.descriptions);
    logStickerParseDebug({ assetId: a.assetid, description: d, stickers });

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
      stickers,
      charms,
    });
  }
  return items;
}

export function isValidInspectLink(link: string | null | undefined): boolean {
  if (!link || typeof link !== "string") return false;
  return /^steam:\/\/rungame\/730\/\d+\/\+csgo_econ_action_preview/i.test(link);
}

/**
 * Parse charms (a.k.a. keychains) from per-description blocks. Each charm
 * description block contains one <img> and a "Charm:" or "Keychain:" name
 * line. We scan each block independently so the image pairs with the name.
 */
function parseCharms(blocks?: Array<{ type?: string; value?: string; name?: string }>): Charm[] {
  if (!blocks?.length) return [];
  const charms: Charm[] = [];
  let slot = 0;
  for (const block of blocks) {
    const value = block.value;
    if (!value) continue;
    const lines = htmlToTextLines(value);
    const names: string[] = [];
    for (const line of lines) {
      const m = line.match(/^(?:Charm|Keychain)s?:\s*(.+)$/i);
      if (m) {
        for (const n of m[1].split(",").map((s) => s.trim()).filter(Boolean)) names.push(n);
      }
    }
    if (!names.length) continue;
    const images: string[] = [];
    for (const match of value.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      images.push(decodeSteamText(match[1]));
    }
    names.forEach((name, i) => {
      charms.push({ name, slot: slot++, image: images[i] });
    });
  }
  return charms;
}


/**
 * Parse real applied stickers from inventory description blocks. Steam exposes
 * them as HTML blocks with one image per sticker plus a `Sticker:` name line.
 * Returns [] when the line is missing — items without stickers must NEVER receive
 * fallback/default data. Preserves slot order and pairs images with names.
 */
function parseStickers(blocks?: Array<{ type?: string; value?: string; name?: string }>): Sticker[] {
  const { names, images } = readStickerMetadata(blocks);
  return names.map((name, i) => ({ name, slot: i, image: images[i] }));
}

function readStickerMetadata(blocks?: Array<{ type?: string; value?: string; name?: string }>): { names: string[]; images: string[]; lines: string[] } {
  if (!blocks?.length) return { names: [], images: [], lines: [] };
  const images: string[] = [];
  const lines: string[] = [];

  for (const block of blocks) {
    const value = block.value;
    if (!value) continue;
    for (const match of value.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      images.push(decodeSteamText(match[1]));
    }
    lines.push(...htmlToTextLines(value));
  }

  const names: string[] = [];
  for (const line of lines) {
    const match = line.match(/^(?:Sticker|Stickers):\s*(.+)$/i);
    if (!match) continue;
    names.push(...splitStickerNames(match[1]));
  }

  if (!names.length) {
    const text = lines.join(" ");
    for (const match of text.matchAll(/(?:^|\s)(?:Sticker|Stickers):\s*(.*?)(?=\s(?:Sticker Slab|Charm|Keychain|Name Tag|Exterior|Paint Seed|Paint Index|Wear Rating|Collection|Quality|Rarity):|$)/gi)) {
      names.push(...splitStickerNames(match[1]));
    }
  }

  return { names, images, lines };
}

function splitStickerNames(value: string): string[] {
  return value
    .replace(/\s+(?:Sticker Slab|Charm|Keychain|Name Tag|Exterior|Paint Seed|Paint Index|Wear Rating|Collection|Quality|Rarity):.*$/i, "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function htmlToTextLines(value: string): string[] {
  return decodeSteamText(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(div|p|center)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function decodeSteamText(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const loggedStickerDebug = new Set<string>();

function logStickerParseDebug({
  assetId,
  description,
  stickers,
}: {
  assetId: string;
  description: SteamInventoryDescription;
  stickers: Sticker[];
}) {
  const raw = readStickerMetadata(description.descriptions);
  const key = `${assetId}:${raw.names.length}:${raw.images.length}:${stickers.length}`;
  if (loggedStickerDebug.has(key)) return;
  const shouldLog = raw.names.length >= 5 || raw.images.length >= 5 || raw.names.length !== stickers.length;
  if (!shouldLog) return;
  loggedStickerDebug.add(key);
  console.info("[steam stickers] raw vs parsed inventory metadata", {
    asset_id: assetId,
    market_hash_name: description.market_hash_name,
    raw_sticker_count: raw.names.length,
    raw_sticker_image_count: raw.images.length,
    parsed_sticker_count: stickers.length,
    parsed_stickers: stickers.map((sticker) => ({ slot: sticker.slot, name: sticker.name, has_image: Boolean(sticker.image) })),
    raw_sticker_lines: raw.lines.filter((line) => /Sticker/i.test(line)),
    actions: description.actions?.map((action) => ({ name: action.name, has_inspect: action.link.includes("+csgo_econ_action_preview") })) ?? [],
    tags: description.tags?.map((tag) => ({ category: tag.category, name: tag.localized_tag_name, internal: tag.internal_name })) ?? [],
  });
}

/** Deterministic float + pattern from inspect link / asset id. Stickers come from real inventory metadata only. */
export function mockInspect(seed: string, wear: string): { float: number; pattern: number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (h >>> 0) / 0xffffffff;
  const ranges: Record<string, [number, number]> = {
    FN: [0, 0.07], MW: [0.07, 0.15], FT: [0.15, 0.38], WW: [0.38, 0.45], BS: [0.45, 1],
  };
  const [lo, hi] = ranges[wear] ?? [0.15, 0.38];
  const float = +(lo + u * (hi - lo)).toFixed(6);
  const pattern = Math.floor(u * 1000);
  return { float, pattern };
}

