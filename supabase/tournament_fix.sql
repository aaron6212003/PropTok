-- 1. Fix RLS on tournament_entries
-- Added policy to allow users to update their own entries (needed for chip deduction)
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own entries" ON public.tournament_entries;
CREATE POLICY "Users can update their own entries" ON public.tournament_entries 
FOR UPDATE USING (auth.uid() = user_id);

-- 2. Update resolve_prediction to handle Tournament Payouts
CREATE OR REPLACE FUNCTION public.resolve_prediction(
  p_id uuid,
  p_outcome text
) RETURNS void AS $$
DECLARE
  v_vote record;
  v_bundle record;
  v_winnings numeric;
BEGIN
  -- 1. Update Prediction Status
  UPDATE public.predictions
  SET resolved = true,
      outcome = p_outcome
  WHERE id = p_id;

  -- 2. Resolve Single Votes
  FOR v_vote IN SELECT * FROM public.votes WHERE prediction_id = p_id LOOP
    IF v_vote.side = p_outcome THEN
        v_winnings := v_vote.wager * v_vote.payout_multiplier;
        
        IF v_vote.tournament_id IS NOT NULL THEN
            -- Pay out to Tournament Stack
            UPDATE public.tournament_entries SET 
                current_stack = current_stack + v_winnings
            WHERE tournament_id = v_vote.tournament_id AND user_id = v_vote.user_id;
        ELSE
            -- Pay out to Main Bankroll
            UPDATE public.users SET 
                bankroll = bankroll + v_winnings
            WHERE id = v_vote.user_id;
        END IF;
    END IF;
  END LOOP;

  -- 3. Resolve Bundles (Parlays)
  -- 3a. Mark bundles as LOST if this leg was a loser
  UPDATE public.bundles b
  SET status = 'LOST'
  FROM public.bundle_legs bl
  WHERE bl.bundle_id = b.id
  AND bl.prediction_id = p_id
  AND bl.side != p_outcome
  AND b.status = 'PENDING';

  -- 3b. Check for WON bundles (all legs resolved and matched)
  FOR v_bundle IN 
    SELECT b.* 
    FROM public.bundles b
    WHERE b.status = 'PENDING'
    AND NOT EXISTS (
      SELECT 1 
      FROM public.bundle_legs bl
      JOIN public.predictions p ON bl.prediction_id = p.id
      WHERE bl.bundle_id = b.id
      AND (p.resolved = false OR p.outcome != bl.side)
    )
  LOOP
    -- Mark as WON
    UPDATE public.bundles SET status = 'WON' WHERE id = v_bundle.id;
    
    -- Pay out
    v_winnings := v_bundle.wager * v_bundle.total_multiplier;
    
    IF v_bundle.tournament_id IS NOT NULL THEN
        -- Pay out to Tournament Stack
        UPDATE public.tournament_entries SET 
            current_stack = current_stack + v_winnings
        WHERE tournament_id = v_bundle.tournament_id AND user_id = v_bundle.user_id;
    ELSE
        -- Pay out to Main Bankroll
        UPDATE public.users SET bankroll = bankroll + v_winnings WHERE id = v_bundle.user_id;
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Use security definer to bypass RLS for payouts
