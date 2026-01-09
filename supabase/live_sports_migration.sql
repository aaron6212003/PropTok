-- Migration to support live sports data and dynamic odds
-- Synced with existing code naming: yes_multiplier, no_multiplier

-- 1. Ensure multiplier columns exist (they might already be there based on actions.ts)
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS yes_multiplier DECIMAL(10,2) DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS no_multiplier DECIMAL(10,2) DEFAULT 2.00;

-- 2. Add external data tracking
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS odds_source TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS raw_odds JSONB;

-- 3. Add an index on external_id for faster ingestion checks
CREATE INDEX IF NOT EXISTS idx_predictions_external_id ON public.predictions(external_id);

-- 4. Set defaults for existing rows if they are null
UPDATE public.predictions SET yes_multiplier = 2.00 WHERE yes_multiplier IS NULL;
UPDATE public.predictions SET no_multiplier = 2.00 WHERE no_multiplier IS NULL;
