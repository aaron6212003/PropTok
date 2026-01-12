-- 1. Add fee and payout columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS creator_fee_percent NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS payout_structure JSONB DEFAULT '{"1": 100}';

-- 2. Create Payout History Table if not exists
CREATE TABLE IF NOT EXISTS public.tournament_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments NOT NULL,
  user_id UUID REFERENCES public.users NOT NULL,
  amount_cents INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'WINNER', 'CREATOR', 'PLATFORM'
  rank INTEGER, -- Only for winners
  status TEXT CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Payouts
ALTER TABLE public.tournament_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payouts viewable by everyone" ON public.tournament_payouts FOR SELECT USING (true);

-- 3. Default updates for existing ACTIVE tournaments
UPDATE public.tournaments 
SET platform_fee_percent = 5, 
    creator_fee_percent = 5,
    payout_structure = '{"1": 70, "2": 20, "3": 10}'
WHERE status = 'ACTIVE';
