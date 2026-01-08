-- 1. Add Stats Columns (Safe to run multiple times)
alter table public.users add column if not exists wins integer default 0;
alter table public.users add column if not exists total_bets integer default 0;

-- 2. The Resolution Engine
create or replace function public.resolve_prediction(
  p_id uuid,
  p_outcome text -- 'YES' or 'NO'
) returns void as $$
declare
  v_vote record;
  v_user_won boolean;
begin
  -- Update the prediction status
  update public.predictions
  set resolved = true,
      outcome = p_outcome
  where id = p_id;

  -- Loop through all votes for this prediction
  for v_vote in select * from public.votes where prediction_id = p_id loop
    
    -- Determine if this vote won
    v_user_won := (v_vote.side = p_outcome);

    -- Update User Stats
    update public.users
    set 
      total_bets = total_bets + 1,
      wins = wins + (case when v_user_won then 1 else 0 end),
      -- Streak logic: Reset if lost, Increment if won
      streak = (case when v_user_won then streak + 1 else 0 end),
      -- Update best streak if current streak is higher
      best_streak = (case 
        when v_user_won and (streak + 1) > best_streak then (streak + 1) 
        else best_streak 
      end)
    where id = v_vote.user_id;

    -- Recalculate Win Rate
    update public.users
    set win_rate = round((wins::numeric / total_bets::numeric) * 100, 1)
    where id = v_vote.user_id;
    
  end loop;
end;
$$ language plpgsql security definer;
