-- Fix RLS to allow users to create their own tournaments
-- Drop existing policy if it conflicts (though likely it's just missing)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tournaments;

-- Allow authenticated users to INSERT, provided they set themselves as the owner
CREATE POLICY "Enable insert for authenticated users" ON public.tournaments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Ensure they can see the tournaments they created (though SELECT public usually covers this)
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.tournaments;
CREATE POLICY "Enable select for all users" ON public.tournaments
FOR SELECT TO authenticated, anon
USING (true);
