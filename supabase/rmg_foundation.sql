-- RMG FOUNDATION MIGRATION
-- "The Vault"
-- Safety: Additive Only. Does not modify existing rows or logic.

BEGIN;

-- 1. UPGRADE USERS TABLE
-- Add secure storage for Real Money vs Play Money
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. TRANSACTION HISTORY (The Ledger)
-- Immutable record of every penny.
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL, -- Negative for spend, Positive for gain
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BUY_IN', 'PAYOUT', 'REFUND')),
    description TEXT,
    reference_id UUID, -- Optional link to tournament_id or stripe_payment_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Transactions (Users see their own only)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
CREATE POLICY "Users view own transactions" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 3. UPGRADE TOURNAMENTS TABLE
-- Add financial configurations
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS entry_fee DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rake_percent DECIMAL(5, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS collected_pool DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE, -- For Private Invites
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

COMMIT;
