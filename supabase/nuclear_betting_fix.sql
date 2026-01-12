-- NUCLEAR BETTING FIX
-- Run this to fix ALL betting and resolution logic

-- 1. Fix Atomic Bet Placement (Switch to cash_balance)
CREATE OR REPLACE FUNCTION place_bet(
  p_user_id UUID,
  p_prediction_id UUID,
  p_side TEXT,
  p_wager NUMERIC,
  p_multiplier NUMERIC,
  p_tournament_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- Validate Wager
  IF p_wager <= 0 THEN
    RETURN jsonb_build_object('error', 'Wager must be positive');
  END IF;

  IF p_tournament_id IS NOT NULL THEN
    -- Tournament Context
    SELECT current_stack INTO v_balance FROM tournament_entries 
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id FOR UPDATE;
    
    IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'Not entered in tournament'); END IF;
    IF v_balance < p_wager THEN RETURN jsonb_build_object('error', 'Insufficient tournament chips'); END IF;

    UPDATE tournament_entries SET current_stack = current_stack - p_wager 
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id;
  ELSE
    -- Real Cash Context
    SELECT cash_balance INTO v_balance FROM users WHERE id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'User not found'); END IF;
    IF v_balance < p_wager THEN RETURN jsonb_build_object('error', 'Insufficient funds'); END IF;

    UPDATE users SET cash_balance = cash_balance - p_wager WHERE id = p_user_id;
  END IF;

  -- Insert Vote
  INSERT INTO votes (user_id, prediction_id, side, wager, payout_multiplier, tournament_id)
  VALUES (p_user_id, p_prediction_id, p_side, p_wager, p_multiplier, p_tournament_id);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix Resolution Logic (Switch to cash_balance + Tournament Support)
create or replace function public.resolve_prediction(
  p_id uuid,
  p_outcome text
) returns void as $$
declare
  v_vote record;
  v_bundle record;
  v_winnings numeric;
begin
  -- Update Prediction Status
  update public.predictions
  set resolved = true,
      outcome = p_outcome
  where id = p_id;

  -- Resolve Single Votes
  for v_vote in select * from public.votes where prediction_id = p_id loop
    if v_vote.side = p_outcome then
        v_winnings := v_vote.wager * v_vote.payout_multiplier;

        -- CASE A: Tournament Bet
        if v_vote.tournament_id is not null then
            update public.tournament_entries 
            set current_stack = current_stack + v_winnings
            where tournament_id = v_vote.tournament_id 
            and user_id = v_vote.user_id;
        
        -- CASE B: Real Cash Bet
        else
            update public.users set 
                cash_balance = cash_balance + v_winnings
            where id = v_vote.user_id;
        end if;
    end if;
  end loop;

  -- Resolve Bundles (Parlays)
  -- Mark bundles as LOST
  update public.bundles b
  set status = 'LOST'
  from public.bundle_legs bl
  where bl.bundle_id = b.id
  and bl.prediction_id = p_id
  and bl.side != p_outcome
  and b.status = 'PENDING';

  -- Check for WON bundles
  for v_bundle in 
    select b.* 
    from public.bundles b
    where b.status = 'PENDING'
    and not exists (
      select 1 
      from public.bundle_legs bl
      join public.predictions p on bl.prediction_id = p.id
      where bl.bundle_id = b.id
      and (p.resolved = false or p.outcome != bl.side)
    )
  loop
    -- Mark as WON
    update public.bundles set status = 'WON' where id = v_bundle.id;
    
    -- Pay out
    v_winnings := v_bundle.wager * v_bundle.total_multiplier;
    
    if v_bundle.tournament_id is not null then
         update public.tournament_entries 
         set current_stack = current_stack + v_winnings
         where tournament_id = v_bundle.tournament_id 
         and user_id = v_bundle.user_id;
    else
         update public.users set cash_balance = cash_balance + v_winnings where id = v_bundle.user_id;
    end if;
  end loop;

end;
$$ language plpgsql SECURITY DEFINER;
