import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchSteamInventory, mockInspect, type InventoryItem } from "@/lib/steam.server";

const CreateSchema = z.object({
  asset_id: z.string().min(1).max(40),
  price_usd: z.number().min(0.01).max(1_000_000),
});

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("steam_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.steam_id) throw new Error("No Steam account linked");

    // Re-fetch inventory live to validate ownership
    let items: InventoryItem[];
    try {
      items = await fetchSteamInventory(profile.steam_id);
    } catch (e) {
      throw new Error(`Could not verify your Steam inventory: ${(e as Error).message}`);
    }
    const item = items.find((i) => i.asset_id === data.asset_id);
    if (!item) throw new Error("This item is no longer in your Steam inventory.");
    if (!item.tradable) throw new Error("This item is currently not tradable.");

    const seed = item.inspect_link || item.asset_id;
    const { float, pattern } = mockInspect(seed, item.wear);
    const stickers = item.stickers ?? [];

    const { data: inserted, error } = await supabaseAdmin
      .from("listings")
      .insert({
        seller_id: userId,
        steam_id: profile.steam_id,
        asset_id: item.asset_id,
        market_hash_name: item.market_hash_name,
        weapon: item.weapon,
        name: item.name,
        wear: item.wear,
        float,
        pattern,
        stickers: stickers as never,
        inspect_link: item.inspect_link,
        icon_url: item.icon_url,
        rarity: item.rarity,
        stattrak: item.stattrak,
        price_usd: data.price_usd,
        status: "active",
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("This item is already listed.");
      throw error;
    }
    return { id: inserted.id };
  });

const UpdateSchema = z.object({ id: z.string().uuid(), price_usd: z.number().min(0.01).max(1_000_000) });

export const updateListingPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("listings").update({ price_usd: data.price_usd }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const IdSchema = z.object({ id: z.string().uuid() });

export const removeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("listings").update({ status: "removed" }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const RelistSchema = z.object({ id: z.string().uuid(), price_usd: z.number().min(0.01).max(1_000_000) });

export const relistListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RelistSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("listings")
      .select("asset_id, steam_id, seller_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.seller_id !== userId) throw new Error("Listing not found");
    // Re-validate ownership
    const items = await fetchSteamInventory(row.steam_id);
    if (!items.some((i) => i.asset_id === row.asset_id)) {
      throw new Error("Item is no longer in your Steam inventory.");
    }
    const { error } = await supabaseAdmin
      .from("listings")
      .update({ status: "active", price_usd: data.price_usd, last_validated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Validate all of a seller's active listings against current Steam inventory. */
export const revalidateMyListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("steam_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.steam_id) return { checked: 0, marked: 0 };
    const { data: rows } = await supabaseAdmin
      .from("listings")
      .select("id, asset_id")
      .eq("seller_id", userId)
      .eq("status", "active");
    if (!rows?.length) return { checked: 0, marked: 0 };
    let items: InventoryItem[] = [];
    try {
      items = await fetchSteamInventory(profile.steam_id);
    } catch {
      return { checked: rows.length, marked: 0 };
    }
    const owned = new Set(items.map((i) => i.asset_id));
    const missing = rows.filter((r) => !owned.has(r.asset_id)).map((r) => r.id);
    if (missing.length) {
      await supabaseAdmin
        .from("listings")
        .update({ status: "unavailable", last_validated_at: new Date().toISOString() })
        .in("id", missing);
    } else {
      await supabaseAdmin
        .from("listings")
        .update({ last_validated_at: new Date().toISOString() })
        .in("id", rows.map((r) => r.id));
    }
    return { checked: rows.length, marked: missing.length };
  });
