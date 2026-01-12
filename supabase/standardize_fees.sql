-- Standardize Tournament Entry Fees
ALTER TABLE public.tournaments RENAME COLUMN entry_fee TO entry_fee_dollars;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS entry_fee_cents INTEGER DEFAULT 0;

-- Migrate existing data
UPDATE public.tournaments 
SET entry_fee_cents = (entry_fee_dollars * 100)::INTEGER 
WHERE entry_fee_cents = 0 AND entry_fee_dollars > 0;

-- Default for standard tournaments
UPDATE public.tournaments SET entry_fee_cents = 1000 WHERE entry_fee_cents = 0;
