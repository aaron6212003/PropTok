-- Migration to support hiding bets from history (Soft Delete)

-- 1. Add hidden_by_user to votes
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS hidden_by_user BOOLEAN DEFAULT false;

-- 2. Add hidden_by_user to bundles
ALTER TABLE public.bundles 
ADD COLUMN IF NOT EXISTS hidden_by_user BOOLEAN DEFAULT false;

-- 3. Add Update Policies for hiding (if not already covered by general update)
-- We check if policies exist first to avoid errors (Supabase SQL style)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'votes' AND policyname = 'Users can update their own votes to hide them.'
    ) THEN
        CREATE POLICY "Users can update their own votes to hide them." 
        ON public.votes FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bundles' AND policyname = 'Users can update their own bundles to hide them.'
    ) THEN
        CREATE POLICY "Users can update their own bundles to hide them." 
        ON public.bundles FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
