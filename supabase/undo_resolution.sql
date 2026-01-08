-- Undo Resolution Engine
create or replace function public.undo_resolve_prediction(
  p_id uuid
) returns void as $$
declare
  v_vote record;
  v_bundle record;
  v_amount_to_subtract numeric;
  v_outcome_to_undo text;
begin
  -- 1. Get the current outcome before we wipe it
  select outcome into v_outcome_to_undo from public.predictions where id = p_id;
  
  if v_outcome_to_undo is null then
    return;
  end if;

  -- 2. Revert Single Votes (Subtract Payouts)
  for v_vote in select * from public.votes where prediction_id = p_id loop
    
    -- Subtract payouts for winners
    if v_vote.side = v_outcome_to_undo then
        v_amount_to_subtract := v_vote.wager * v_vote.payout_multiplier;
        update public.users set 
            bankroll = bankroll - v_amount_to_subtract,
            wins = wins - 1,
            total_bets = total_bets - 1,
            -- Note: Accurate streak reversal is hard without history, 
            -- but we'll simply decrement it or zero it for safety.
            streak = greatest(0, streak - 1)
        where id = v_vote.user_id;
    else
        -- Losers just get their bet stats reverted
        update public.users set 
            total_bets = total_bets - 1
        where id = v_vote.user_id;
    end if;

    -- Recalculate Win Rate
    update public.users
    set win_rate = case 
        when total_bets > 0 then round((wins::numeric / total_bets::numeric) * 100, 1)
        else 0 
    end
    where id = v_vote.user_id;
  end loop;

  -- 3. Revert Bundles (Parlays)
  
  -- 3a. Revert WON bundles to PENDING and subtract bankroll
  for v_bundle in 
    select b.* 
    from public.bundles b
    join public.bundle_legs bl on bl.bundle_id = b.id
    where bl.prediction_id = p_id
    and b.status = 'WON'
  loop
    -- Mark back as PENDING
    update public.bundles set status = 'PENDING', acknowledged = false where id = v_bundle.id;
    
    -- Subtract payout
    v_amount_to_subtract := v_bundle.wager * v_bundle.total_multiplier;
    update public.users set bankroll = bankroll - v_amount_to_subtract where id = v_bundle.user_id;
  end loop;

  -- 3b. Revert LOST bundles to PENDING
  -- IMPORTANT: Only revert if THIS leg was the reason it was lost.
  -- If there were other losing legs, it stays LOST.
  update public.bundles b
  set status = 'PENDING', acknowledged = false
  where id in (
    select bl.bundle_id 
    from public.bundle_legs bl
    where bl.prediction_id = p_id
    and bl.side != v_outcome_to_undo -- This leg was a loser
  )
  and b.status = 'LOST'
  and not exists (
    -- Ensure no OTHER losing legs exist
    select 1 
    from public.bundle_legs bl2
    join public.predictions p2 on bl2.prediction_id = p2.id
    where bl2.bundle_id = b.id
    and bl2.prediction_id != p_id
    and p2.resolved = true
    and p2.outcome != bl2.side
  );

  -- 4. Finally, re-open the prediction
  update public.predictions
  set resolved = false,
      outcome = null
  where id = p_id;

end;
$$ language plpgsql security definer;
