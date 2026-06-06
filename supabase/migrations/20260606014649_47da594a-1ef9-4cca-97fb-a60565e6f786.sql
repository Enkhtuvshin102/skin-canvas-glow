-- 1. Add bank info columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS account_name text;

-- 2. Add 'payment_pending' to listing_status enum
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'payment_pending';

-- 3. Transaction status enum
DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('payment_pending', 'paid', 'completed', 'cancelled', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  price numeric NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'payment_pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers and sellers can view their transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can insert their own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers and sellers can update their transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();