CREATE OR REPLACE FUNCTION admin_reset_tournament(p_tournament_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Delete all votes associated with this tournament
    DELETE FROM votes WHERE tournament_id = p_tournament_id;

    -- 2. Delete all bundles associated with this tournament
    -- Note: bundle_legs will cascade delete from bundles
    DELETE FROM bundles WHERE tournament_id = p_tournament_id;

    -- 3. Reset all entries for this tournament to initial state
    UPDATE tournament_entries
    SET 
        current_stack = 500,  -- Reset stack to starting amount (or retrieve dynamic starting stack if stored)
        total_wins = 0,
        total_bets = 0,
        win_rate = 0,
        streak = 0,
        best_streak = 0
    WHERE tournament_id = p_tournament_id;

END;
$$;
