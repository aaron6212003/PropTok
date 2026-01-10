-- FRAMEWORK REPAIR SCRIPT
-- Run this to fix "Loading..." hangs and "Invisible Tournaments"

BEGIN;

-- 1. FIX TOURNAMENTS PERMISSIONS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read tournaments" ON public.tournaments;
CREATE POLICY "Anyone can read tournaments" ON public.tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create tournaments" ON public.tournaments;
CREATE POLICY "Auth users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. FIX USERS PERMISSIONS (Required to see "Community" owners)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read usernames" ON public.users;
CREATE POLICY "Anyone can read usernames" ON public.users FOR SELECT USING (true);

-- 3. FIX ENTRIES PERMISSIONS
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read entries" ON public.tournament_entries;
CREATE POLICY "Anyone can read entries" ON public.tournament_entries FOR SELECT USING (true);

-- 4. ENSURE COLUMNS EXIST (Prevent Crashes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='filter_category') THEN
        ALTER TABLE public.tournaments ADD COLUMN filter_category text DEFAULT 'All';
    END IF;
END $$;

-- 5. DATA CLEANUP (Make sure everything is visible)
-- Set all existing tournaments to ACTIVE
UPDATE public.tournaments SET status = 'ACTIVE' WHERE status IS NULL;
-- Set all Featured Tournaments (Null Owner) to have 'All' category if missing
UPDATE public.tournaments SET filter_category = 'All' WHERE owner_id IS NULL AND filter_category IS NULL;

COMMIT;
