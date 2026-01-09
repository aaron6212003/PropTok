create or replace function public.admin_wipe_data()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Delete Dependencies first (to avoid Foreign Key crashes)
  -- "where true" is added to satisfy "safe update" mode which blocks DELETE without WHERE
  delete from public.bundle_legs where true;
  delete from public.votes where true;
  delete from public.bundles where true;

  -- 2. Delete all Predictions (excluding the 'zero' placeholder)
  delete from public.predictions 
  where id != '00000000-0000-0000-0000-000000000000';
  
  -- 3. Reset User stats
  update public.users 
  set bankroll = 1000, 
      win_rate = 0, 
      streak = 0, 
      best_streak = 0
  where true; -- Also explicit for updates

end;
$$;
