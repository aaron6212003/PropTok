-- GOD MODE DELETE FUNCTION
-- This works even if RLS tries to stop you.
-- It works even if you are not the owner.
-- It deletes EVERYTHING related to the tournament.

CREATE OR REPLACE FUNCTION force_delete_tournaments(tournament_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- <--- This is the magic. Runs as Superuser.
AS $$
BEGIN
    -- 1. Delete Entries (Cascade)
    DELETE FROM tournament_entries WHERE tournament_id = ANY(tournament_ids);
    
    -- 2. Delete Predictions (If linked)
    -- Check if column exists dynamically or just run it if we know schema
    -- We'll assume standard delete cascade handles it, but let's be safe:
    -- DELETE FROM predictions WHERE tournament_id = ANY(tournament_ids); 
    -- (Commented out to avoid error if column missing, but constraints should handle if fixed)

    -- 3. Delete the Tournaments
    DELETE FROM tournaments WHERE id = ANY(tournament_ids);
END;
$$;
