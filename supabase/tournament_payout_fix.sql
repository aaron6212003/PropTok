-- Add tournament_id to bundles
alter table public.bundles add column if not exists tournament_id uuid references public.tournaments;

-- Update resolve_prediction to handle tournament-specific payouts
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
        if v_vote.tournament_id is not null then
            -- Tournament Payout
            update public.tournament_entries set 
                current_stack = current_stack + v_winnings
            where tournament_id = v_vote.tournament_id and user_id = v_vote.user_id;
        else
            -- Main Bankroll Payout
            update public.users set 
                bankroll = bankroll + v_winnings
            where id = v_vote.user_id;
        end if;
    end if;
  end loop;

  -- 3. Resolve Bundles (Parlays)
  
  -- 3a. Mark bundles as LOST if this leg was a loser
  update public.bundles b
  set status = 'LOST'
  from public.bundle_legs bl
  where bl.bundle_id = b.id
  and bl.prediction_id = p_id
  and bl.side != p_outcome
  and b.status = 'PENDING';

  -- 3b. Check for WON bundles (all legs resolved and matched)
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
        -- Tournament Payout
        update public.tournament_entries set 
            current_stack = current_stack + v_winnings
        where tournament_id = v_bundle.tournament_id and user_id = v_bundle.user_id;
    else
        -- Main Bankroll Payout
        update public.users set bankroll = bankroll + v_winnings where id = v_bundle.user_id;
    end if;
  end loop;

end;
$$ language plpgsql;

-- Update undo_resolve_prediction to handle tournament stack reversion
create or replace function public.undo_resolve_prediction(
  p_id uuid
) returns void as $$
declare
  v_vote record;
  v_bundle record;
  v_payout numeric;
begin
  -- 1. Single Votes
  for v_vote in select * from public.votes where prediction_id = p_id loop
    if v_vote.side = (select outcome from public.predictions where id = p_id) then
      v_payout := v_vote.wager * v_vote.payout_multiplier;
      if v_vote.tournament_id is not null then
        update public.tournament_entries set current_stack = current_stack - v_payout
        where tournament_id = v_vote.tournament_id and user_id = v_vote.user_id;
      else
        update public.users set bankroll = bankroll - v_payout
        where id = v_vote.user_id;
        -- Revert stats
        update public.users set 
          win_rate = case when (select count(*) from public.votes where user_id = v_vote.user_id and side = outcome) > 1 
                     then ((select count(*) from public.votes where user_id = v_vote.user_id and side = outcome) - 1)::float / nullif((select count(*) from public.votes where user_id = v_vote.user_id and outcome is not null) - 1, 0)
                     else 0 end
        where id = v_vote.user_id;
      end if;
    end if;
    
    -- Reset acknowledged status
    update public.votes set acknowledged = false where id = v_vote.id;
  end loop;

  -- 2. Bundles
  for v_bundle in 
    select b.* 
    from public.bundles b
    join public.bundle_legs bl on bl.bundle_id = b.id
    where bl.prediction_id = p_id
  loop
    -- If it was WON, deduct payout
    if v_bundle.status = 'WON' then
      v_payout := v_bundle.wager * v_bundle.total_multiplier;
      if v_bundle.tournament_id is not null then
        update public.tournament_entries set current_stack = current_stack - v_payout
        where tournament_id = v_bundle.tournament_id and user_id = v_bundle.user_id;
      else
        update public.users set bankroll = bankroll - v_payout where id = v_bundle.user_id;
      end if;
    end if;

    -- Reset status to PENDING
    update public.bundles set status = 'PENDING', acknowledged = false where id = v_bundle.id;
  end loop;

  -- 3. Reset Prediction
  update public.predictions
  set resolved = false,
      outcome = null
  where id = p_id;
end;
$$ language plpgsql;
