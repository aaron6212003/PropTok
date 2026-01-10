-- 1. Ensure the Tournament Exists (Featured)
INSERT INTO public.tournaments (name, description, entry_fee, starting_stack, status, is_public, owner_id)
SELECT 'NFL Weekend Showdown', 'The ultimate NFL battle. $10 Buy-in. 1000 Chips.', 10, 1000, 'ACTIVE', true, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments WHERE name ILIKE '%NFL%'
);

-- 2. Capture the Tournament ID
DO $$
DECLARE
    v_nfl_id uuid;
BEGIN
    SELECT id INTO v_nfl_id FROM public.tournaments WHERE name ILIKE '%NFL%' LIMIT 1;

    -- 3. Force Update metadata (Ensure it's Featured)
    UPDATE public.tournaments
    SET 
        owner_id = NULL,
        status = 'ACTIVE',
        entry_fee = 10,
        starting_stack = 1000,
        is_public = true
    WHERE id = v_nfl_id;

    -- 4. Restore Missing Participants from Transaction History
    -- Logic: If they paid for "NFL", put them back in if not currently entered.
    INSERT INTO public.tournament_entries (tournament_id, user_id, current_stack)
    SELECT DISTINCT v_nfl_id, t.user_id, 1000
    FROM public.transactions t
    WHERE t.description ILIKE '%NFL%' 
      AND t.amount < 0 -- It was a deduction (Buy-in)
      AND NOT EXISTS (
          SELECT 1 FROM public.tournament_entries te 
          WHERE te.tournament_id = v_nfl_id AND te.user_id = t.user_id
      );
      
    RAISE NOTICE 'Restored NFL Tournament and Participants.';
END $$;
