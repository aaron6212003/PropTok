-- FIX LEADERBOARD VISIBILITY
-- The issue is likely that users can only see their own 'tournament_entries' or 'users' rows.
-- We need to ensure that EVERYONE can view ALL tournament entries and ALL user profiles (at least publicly available fields).

BEGIN;

-- 1. OPEN UP TOURNAMENT ENTRIES
-- Allow anyone (authenticated) to view all entries.
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.tournament_entries;
CREATE POLICY "Enable read access for all users" 
ON public.tournament_entries FOR SELECT 
TO authenticated 
USING (true);

-- Ensure users can insert their own entry (already likely exists, but let's be safe)
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.tournament_entries;
CREATE POLICY "Enable insert for users based on user_id" 
ON public.tournament_entries FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. ENSURE PUBLIC PROFILES ARE VISIBLE
-- We likely already did this, but let's reinforce it.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "Enable read access for all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (true);

-- 3. FIX updateProfile policy (while we're here, just in case)
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
CREATE POLICY "Enable update for users based on id" 
ON public.users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMIT;
