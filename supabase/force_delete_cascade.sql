-- FORCE CASCADE DELETE (The "Nuclear" Option)
-- Run this to fix "Delete not working" issues.

BEGIN;

-- 1. Remove strict constraints on entries
ALTER TABLE tournament_entries
DROP CONSTRAINT IF EXISTS tournament_entries_tournament_id_fkey;

-- 2. add them back with CASCADE (Delete Tournament = Delete Entry)
ALTER TABLE tournament_entries
ADD CONSTRAINT tournament_entries_tournament_id_fkey
FOREIGN KEY (tournament_id)
REFERENCES tournaments(id)
ON DELETE CASCADE;

-- 3. Also allow "Prediction" deletion to work if they are linked
ALTER TABLE predictions
DROP CONSTRAINT IF EXISTS predictions_tournament_id_fkey;

-- (If predictions have tournament_id, link them too. If not, this line just fails harmlessly in some dialects, but in Postgres we check column existence first if we were fancy. Here we just assume safe.)
-- If the column exists, this makes sure we can delete tournaments without stranding predictions.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'predictions' AND column_name = 'tournament_id') THEN
        ALTER TABLE predictions
        ADD CONSTRAINT predictions_tournament_id_fkey
        FOREIGN KEY (tournament_id)
        REFERENCES tournaments(id)
        ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;

-- 4. Verify it works by checking one (Optional)
-- SELECT * FROM tournaments LIMIT 1;
