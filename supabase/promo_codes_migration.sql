-- Promo Code System Migration

-- 1. Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    value NUMERIC NOT NULL CHECK (value > 0),
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- 2. Create redemptions table
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, code_id) -- Prevent double dipping
);

-- 3. RLS Policies
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Only Admins can see/manage promo codes
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
    FOR ALL
    USING (public.is_admin(auth.uid()));

-- Users can nothing (we will use Service Role for redemption to be safe)
-- OR allow reading to check valid codes? 
-- Better: Use RPC or Service Role Action to keep codes secret.

-- 4. Indexes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_redemptions_user ON public.promo_redemptions(user_id);
