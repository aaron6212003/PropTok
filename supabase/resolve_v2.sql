-- UPDATED RESOLUTION LOGIC (Supports Tournaments & Bankroll)
create or replace function public.resolve_prediction(
  p_id uuid,
  p_outcome text
) returns void as $$
declare
  v_vote record;
  v_bundle record;
  v_winnings numeric;
begin
  -- 1. Update Prediction Status
  update public.predictions
  set resolved = true,
      outcome = p_outcome
  where id = p_id;

  -- 2. Resolve Single Votes
  for v_vote in select * from public.votes where prediction_id = p_id loop
    if v_vote.side = p_outcome then
        v_winnings := v_vote.wager * v_vote.payout_multiplier;

        -- CASE A: Tournament Bet
        if v_vote.tournament_id is not null then
            update public.tournament_entries 
            set current_stack = current_stack + v_winnings
            where tournament_id = v_vote.tournament_id 
            and user_id = v_vote.user_id;
        
        -- CASE B: Standard Bankroll Bet
        else
            update public.users set 
                bankroll = bankroll + v_winnings
            where id = v_vote.user_id;
        end if;
    end if;
  end loop;

  -- 3. Resolve Bundles (Parlays) - Note: Tournaments don't support bundles yet in this logic, assuming global only for now
  
  -- 3a. Mark bundles as LOST if this leg was a loser
  update public.bundles b
  set status = 'LOST'
  from public.bundle_legs bl
  where bl.bundle_id = b.id
  and bl.prediction_id = p_id
  and bl.side != p_outcome
  and b.status = 'PENDING';

  -- 3b. Check for WON bundles
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
    update public.users set bankroll = bankroll + v_winnings where id = v_bundle.user_id;
  end loop;

end;
$$ language plpgsql SECURITY DEFINER;
