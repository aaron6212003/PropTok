-- UNIFIED FIX: TOURNAMENTS
-- Run this in Supabase SQL Editor to fix "Loading..." and "Creation" issues.

-- 1. Ensure 'filter_category' column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'filter_category') THEN
        ALTER TABLE public.tournaments ADD COLUMN filter_category text DEFAULT 'All';
    END IF;
END $$;

-- 2. RESET RLS POLICIES (Fix "Loading" hang)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.tournaments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tournaments;
DROP POLICY IF EXISTS "Enable update for owners" ON public.tournaments;

-- Allow EVERYONE to Read (Fixes the feed loading)
CREATE POLICY "Enable read access for all users" ON public.tournaments
FOR SELECT USING (true);

-- Allow Authenticated Users to Create (Community Tournaments)
CREATE POLICY "Enable insert for authenticated users" ON public.tournaments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow Owners to Update their own
CREATE POLICY "Enable update for owners" ON public.tournaments
FOR UPDATE USING (auth.uid() = owner_id);

-- 3. FORCE VISIBILITY FIX (Make Featured Tournaments Public)
UPDATE public.tournaments
SET 
  owner_id = NULL,
  status = 'ACTIVE', 
  filter_category = 'All' 
WHERE owner_id IS NOT NULL AND name ILIKE '%NFL%'; -- Only fix intended system tournaments if possible, or reset all if needed.

-- Actually, let's just ensure the existing ones are visible:
UPDATE public.tournaments
SET start_time = now(), status = 'ACTIVE'
WHERE status IS NULL;
