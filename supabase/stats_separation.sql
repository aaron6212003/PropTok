-- Add Total Bets/Wins to Users (for Career Stats)
alter table public.users add column if not exists total_bets integer default 0;
alter table public.users add column if not exists total_wins integer default 0;

-- Add Detailed Stats to Tournament Entries (for Tournament-Specific Stats)
alter table public.tournament_entries add column if not exists win_rate numeric default 0;
alter table public.tournament_entries add column if not exists streak integer default 0;
alter table public.tournament_entries add column if not exists best_streak integer default 0;
alter table public.tournament_entries add column if not exists total_bets integer default 0;
alter table public.tournament_entries add column if not exists total_wins integer default 0;

-- Update resolve_prediction to handle separated stats
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
    
    -- Determine Win/Loss
    if v_vote.side = p_outcome then
        -- WINNER
        v_winnings := v_vote.wager * v_vote.payout_multiplier;

        if v_vote.tournament_id is not null then
            -- Tournament Payout & Stats
            update public.tournament_entries set 
                current_stack = current_stack + v_winnings,
                total_bets = total_bets + 1,
                total_wins = total_wins + 1,
                streak = streak + 1,
                best_streak = greatest(best_streak, streak + 1),
                win_rate = ((total_wins + 1)::float / (total_bets + 1)::float) * 100
            where tournament_id = v_vote.tournament_id and user_id = v_vote.user_id;
        else
            -- Main Bankroll Payout & Stats
            update public.users set 
                bankroll = bankroll + v_winnings,
                total_bets = total_bets + 1,
                total_wins = total_wins + 1,
                streak = streak + 1,
                best_streak = greatest(best_streak, streak + 1),
                win_rate = ((total_wins + 1)::float / (total_bets + 1)::float) * 100
            where id = v_vote.user_id;
        end if;

    else
        -- LOSER
        if v_vote.tournament_id is not null then
            -- Tournament Stats (Reset Streak)
            update public.tournament_entries set 
                total_bets = total_bets + 1,
                streak = 0,
                win_rate = (total_wins::float / (total_bets + 1)::float) * 100
            where tournament_id = v_vote.tournament_id and user_id = v_vote.user_id;
        else
            -- Main Bankroll Stats (Reset Streak)
            update public.users set 
                total_bets = total_bets + 1,
                streak = 0,
                win_rate = (total_wins::float / (total_bets + 1)::float) * 100
            where id = v_vote.user_id;
        end if;
    end if;
    
  end loop;

  -- 3. Resolve Bundles (Parlays)
  -- Logic: 
  -- IF outcome matches leg -> Do nothing (wait for other legs)
  -- IF outcome DOES NOT match leg -> Mark bundle LOST immediately
  
  -- 3a. Mark bundles as LOST if this leg was a loser
  update public.bundles b
  set status = 'LOST'
  from public.bundle_legs bl
  where bl.bundle_id = b.id
  and bl.prediction_id = p_id
  and bl.side != p_outcome
  and b.status = 'PENDING';
  
  -- We also need to update stats for LOST bundles immediately?
  -- Current logic assumes 'total_bets' counts bundles?
  -- A bundle is one bet. When it resolves (WIN or LOSS), we update stats.
  -- Determining "Bundle Resolved" is tricky in SQL loops.
  
  -- For MVP simplicity: We only count Single Votes in Stats for now to avoid double counting or complex state.
  -- OR we can update stats here if status changes to LOST.
  -- Let's stick to Single Votes driving the stats for now to be safe, or revisit Bundle stats later.

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
        update public.tournament_entries set 
            current_stack = current_stack + v_winnings
        where tournament_id = v_bundle.tournament_id and user_id = v_bundle.user_id;
    else
        update public.users set bankroll = bankroll + v_winnings where id = v_bundle.user_id;
    end if;
  end loop;

end;
$$ language plpgsql;
