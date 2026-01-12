-- ==========================================
-- NUCLEAR TOURNAMENT FIX (Run this in Supabase SQL Editor)
-- ==========================================

-- 1. FIX SCHEMA: Ensure 'tournament_entries' has all required columns
ALTER TABLE public.tournament_entries 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

ALTER TABLE public.tournament_entries 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

ALTER TABLE public.tournament_entries 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE public.tournament_entries
ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

-- 2. FIX PERMISSIONS: Force enable access for authenticated users
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Entries are viewable by everyone." ON public.tournament_entries;
DROP POLICY IF EXISTS "Users can join." ON public.tournament_entries;
DROP POLICY IF EXISTS "Enable all access" ON public.tournament_entries; 
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.tournament_entries; -- ADDED THIS LINE

-- Create one permissive policy for ALL operations
CREATE POLICY "Enable all access for authenticated users" 
ON public.tournament_entries 
FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Also allow public read access just in case
CREATE POLICY "Enable public read access" 
ON public.tournament_entries 
FOR SELECT 
USING (true);

-- 3. CLEAN UP DATA: Remove duplicate/stuck entries for a clean start
-- Only run this if you want to wipe current participants to test fresh
-- DELETE FROM public.tournament_entries; 

-- 4. FIX LEGACY TABLE: Ensure 'tournament_participants' doesn't block migration
-- (Optional cleanup)
-- DELETE FROM public.tournament_participants;

-- 5. VERIFY: Confirm columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournament_entries';
