-- FIX: Enable Cascade Delete for Tournament Entries ONLY
-- This ensures that when a TOURNAMENT is deleted, all its ENTRIES are deleted automatically.

-- 1. Drop existing constraint if it exists
ALTER TABLE tournament_entries DROP CONSTRAINT IF EXISTS tournament_entries_tournament_id_fkey;

-- 2. Re-add constraint with CASCADE
ALTER TABLE tournament_entries
ADD CONSTRAINT tournament_entries_tournament_id_fkey
FOREIGN KEY (tournament_id)
REFERENCES tournaments(id)
ON DELETE CASCADE;

-- Note: Predictions do not seem to have a direct foreign key to tournaments in this schema version.
-- If they did, we would cascade them too. For now, we assume they are loosely coupled.
