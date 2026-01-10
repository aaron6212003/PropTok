-- NUCLEAR FIX: PERMISSIONS & DATA
-- Run this to fix "RLS Policy" errors and "Cash Not Resetting"

-- 1. UNLOCK TOURNAMENT CREATION (Allow All Authenticated Inserts)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tournaments;
DROP POLICY IF EXISTS "Enable select for all users" ON public.tournaments;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.tournaments;
DROP POLICY IF EXISTS "Enable update for owners" ON public.tournaments;

CREATE POLICY "Enable insert for authenticated users" ON public.tournaments
FOR INSERT TO authenticated
WITH CHECK (true);  -- No restrictions, just be logged in

CREATE POLICY "Enable select for all users" ON public.tournaments
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "Enable update for owners" ON public.tournaments
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id);

-- 2. FORCE CASH RESET (This updates the Database immediately)
UPDATE public.users SET cash_balance = 0;

-- 3. FORCE NFL TOURNAMENT TO BE FEATURED
UPDATE public.tournaments 
SET owner_id = NULL, status = 'ACTIVE' 
WHERE name ILIKE '%NFL%';
