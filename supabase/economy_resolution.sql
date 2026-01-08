-- Updated Resolution Logic with Payoutscan
create or replace function public.resolve_prediction(
  p_id uuid,
  p_outcome text
) returns void as $$
declare
  v_vote record;
  v_winnings numeric;
begin
  -- 1. Update Prediction Status
  update public.predictions
  set resolved = true,
      outcome = p_outcome
  where id = p_id;

  -- 2. Loop through all votes for this prediction
  for v_vote in select * from public.votes where prediction_id = p_id loop
    
    -- Check if they won
    if v_vote.side = p_outcome then
        -- Calculate Winnings (Return Stake + Profit? Or just Multiplier?)
        -- Standard Betting: Payout = Stake * Multiplier (Includes Stake)
        v_winnings := v_vote.wager * v_vote.payout_multiplier;
        
        -- Update User: Add Winnings
        -- Note: We assume Wager was ALREADY deducted when they voted.
        update public.users
        set 
            wins = wins + 1,
            streak = streak + 1,
            best_streak = greatest(streak + 1, best_streak),
            bankroll = bankroll + v_winnings
        where id = v_vote.user_id;
        
    else
        -- They Lost
        update public.users
        set 
            streak = 0
            -- bankroll is NOT changed because wager was deducted upfront
        where id = v_vote.user_id;
    end if;
    
    -- Increment total bets count (win or loss)
    update public.users 
    set total_bets = total_bets + 1
    where id = v_vote.user_id;

    -- Recalculate Win Rate
    update public.users
    set win_rate = round((wins::numeric / total_bets::numeric) * 100, 1)
    where id = v_vote.user_id and total_bets > 0;
    
  end loop;
end;
$$ language plpgsql;
