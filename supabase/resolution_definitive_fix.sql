
-- COMPREHENSIVE FIX FOR PREDICTION RESOLUTION
-- Handles:
-- 1. Single Votes (Cash & Tournament)
-- 2. Bundles (Cash & Tournament)
-- 3. Validation and Status Updates

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
    -- Only payout if the user won
    IF v_vote.side = p_outcome THEN
        v_winnings := v_vote.wager * v_vote.payout_multiplier;
        
        IF v_vote.tournament_id IS NOT NULL THEN
            -- TOURNAMENT PAYOUT
            UPDATE public.tournament_entries 
            SET current_stack = current_stack + v_winnings
            WHERE tournament_id = v_vote.tournament_id AND user_id = v_vote.user_id;
        ELSE
            -- CASH PAYOUT
            UPDATE public.users 
            SET cash_balance = cash_balance + v_winnings -- Ensure we use cash_balance, not bankroll (legacy)
            WHERE id = v_vote.user_id;
        END IF;
    END IF;
  END LOOP;

  -- 3. Resolve Bundles (Parlays)
  
  -- 3a. Mark bundles as LOST if this leg was a loser
  -- If the prediction outcome DOES NOT MATCH the leg side, the whole bundle loses.
  UPDATE public.bundles b
  SET status = 'LOST'
  FROM public.bundle_legs bl
  WHERE bl.bundle_id = b.id
  AND bl.prediction_id = p_id
  AND bl.side != p_outcome
  AND b.status = 'PENDING';

  -- 3b. Check for WON bundles (all legs resolved and matched)
  -- A bundle is WON if all its legs correspond to resolved predictions that match the leg side.
  -- We iterate over PENDING bundles and check if they are now complete.
  FOR v_bundle IN 
    SELECT b.* 
    FROM public.bundles b
    WHERE b.status = 'PENDING'
    AND NOT EXISTS (
      -- If there is ANY leg that is NOT correctly resolved, the bundle is not yet won.
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
        -- TOURNAMENT PAYOUT
        UPDATE public.tournament_entries 
        SET current_stack = current_stack + v_winnings
        WHERE tournament_id = v_bundle.tournament_id AND user_id = v_bundle.user_id;
    ELSE
        -- CASH PAYOUT
        UPDATE public.users 
        SET cash_balance = cash_balance + v_winnings
        WHERE id = v_bundle.user_id;
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
