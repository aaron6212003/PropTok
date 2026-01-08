-- 1. Ensure columns exist (Idempotent check)
alter table public.predictions add column if not exists prop_type text;
alter table public.predictions add column if not exists line numeric;
alter table public.predictions add column if not exists player_name text;

-- 2. ENABLE INSERTS
-- Checks if policy exists before creating to avoid errors? 
-- Simplest way in Supabase SQL Editor is just drop and recreate.

drop policy if exists "Predictions are viewable by everyone." on public.predictions;
create policy "Predictions are viewable by everyone." on public.predictions for select using (true);

drop policy if exists "Enable insert for everyone." on public.predictions;
create policy "Enable insert for everyone." on public.predictions for insert with check (true);

drop policy if exists "Enable update for everyone." on public.predictions;
create policy "Enable update for everyone." on public.predictions for update using (true);

-- 3. Confirm
select 'RLS Policies Updated' as status;
