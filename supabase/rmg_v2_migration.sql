-- RMG V2 Migration
-- Adds real money fields using integer cents and Stripe metadata

BEGIN;

-- 1. UPGRADE TOURNAMENTS
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS entry_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft', -- draft, open, active, ended, paid
ADD COLUMN IF NOT EXISTS max_players INTEGER;

-- 2. UPGRADE TOURNAMENT ENTRIES
ALTER TABLE public.tournament_entries
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 3. CREATE PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.tournament_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id),
    winner_user_id UUID REFERENCES public.users(id),
    pool_cents INTEGER NOT NULL,
    winner_cents INTEGER NOT NULL,
    host_cents INTEGER NOT NULL,
    platform_cents INTEGER NOT NULL,
    stripe_transfer_winner_id TEXT,
    stripe_transfer_host_id TEXT,
    stripe_transfer_platform_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, paid, failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Payouts
ALTER TABLE public.tournament_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read payouts" ON public.tournament_payouts FOR SELECT USING (true);

-- 4. UPGRADE PROFILES (USERS)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

COMMIT;
