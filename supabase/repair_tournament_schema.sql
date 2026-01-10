-- 1. Ensure Schema Exists (Fix missing columns)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS entry_fee decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS collected_pool decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_players integer,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS rake_percent decimal DEFAULT 10,
ADD COLUMN IF NOT EXISTS starting_stack integer DEFAULT 1000;

-- 2. Reset Ecosystem (Wipe cash)
UPDATE public.users 
SET cash_balance = 0;

-- 3. Restore "NFL Weekend" (Feature it)
UPDATE public.tournaments
SET 
    owner_id = NULL,    -- System Owned
    status = 'ACTIVE',
    entry_fee = 10,     -- $10 Buy-in
    starting_stack = 1000,
    is_public = true
WHERE name ILIKE '%NFL Weekend%';

-- 4. Ensure we have at least one featured tournament if NFL is missing
INSERT INTO public.tournaments (name, description, entry_fee, starting_stack, status, is_public, owner_id)
SELECT 'Official NFL Weekly', 'The biggest weekly showdown. $10 Entry.', 10, 1000, 'ACTIVE', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments WHERE name ILIKE '%NFL%');
