import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchSteamInventory, type InventoryItem } from "@/lib/steam.server";

const CACHE_TTL_MS = 15 * 60 * 1000;

async function getCachedInventory(steamId: string): Promise<InventoryItem[]> {
  const { data: cached } = await supabaseAdmin
    .from("inventory_cache")
    .select("items, fetched_at")
    .eq("steam_id", steamId)
    .maybeSingle();
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return (cached.items as unknown as InventoryItem[]) ?? [];
  }
  const items = await fetchSteamInventory(steamId);
  await supabaseAdmin
    .from("inventory_cache")
    .upsert({ steam_id: steamId, items: items as unknown as object, fetched_at: new Date().toISOString() });
  return items;
}

export const getMyInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("steam_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.steam_id) {
      return { items: [] as InventoryItem[], error: "No Steam account linked" };
    }
    try {
      const items = await getCachedInventory(profile.steam_id);
      // Filter out items already actively listed
      const { data: active } = await supabaseAdmin
        .from("listings")
        .select("asset_id")
        .eq("seller_id", userId)
        .eq("status", "active");
      const listedIds = new Set((active ?? []).map((l) => l.asset_id));
      return {
        items: items.map((it) => ({ ...it, listed: listedIds.has(it.asset_id) })),
        steamId: profile.steam_id,
        error: null as string | null,
      };
    } catch (e) {
      return { items: [] as InventoryItem[], error: (e as Error).message };
    }
  });
