
-- timestamp updater
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles: linked to auth.users, holds Steam identity
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  steam_id TEXT UNIQUE NOT NULL,
  persona TEXT,
  avatar_url TEXT,
  profile_url TEXT,
  last_inventory_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- listings status enum
CREATE TYPE public.listing_status AS ENUM ('active','sold','unavailable','removed');

-- listings: items are still owned by sellers on Steam
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  steam_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  market_hash_name TEXT NOT NULL,
  weapon TEXT NOT NULL,
  name TEXT NOT NULL,
  wear TEXT NOT NULL,
  float NUMERIC(10,8) NOT NULL,
  pattern INT NOT NULL,
  stickers JSONB NOT NULL DEFAULT '[]'::jsonb,
  inspect_link TEXT NOT NULL,
  icon_url TEXT,
  rarity TEXT NOT NULL DEFAULT 'classified',
  stattrak BOOLEAN NOT NULL DEFAULT false,
  price_usd NUMERIC(12,2) NOT NULL CHECK (price_usd > 0),
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings public read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Sellers insert own" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers update own" ON public.listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers delete own" ON public.listings FOR DELETE USING (auth.uid() = seller_id);

CREATE UNIQUE INDEX listings_active_unique_asset
  ON public.listings (steam_id, asset_id) WHERE status = 'active';
CREATE INDEX listings_status_created ON public.listings (status, created_at DESC);
CREATE INDEX listings_seller_idx ON public.listings (seller_id);
CREATE INDEX listings_price_idx ON public.listings (price_usd);
CREATE INDEX listings_float_idx ON public.listings (float);

CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- inventory cache (server-only)
CREATE TABLE public.inventory_cache (
  steam_id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_cache ENABLE ROW LEVEL SECURITY;
-- no policies => only service role can access

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
ALTER TABLE public.listings REPLICA IDENTITY FULL;
