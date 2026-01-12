-- Identify duplicates by (tournament_id, user_id)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY tournament_id, user_id 
               ORDER BY created_at DESC
           ) as rn
    FROM public.tournament_entries
)
-- Delete all but the most recent one (rn = 1)
DELETE FROM public.tournament_entries
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- OPTIONAL: Add constraint to prevent future duplicates if it doesn't exist
-- ALTER TABLE public.tournament_entries ADD CONSTRAINT unique_user_tournament UNIQUE (user_id, tournament_id);
