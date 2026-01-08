-- Bundles (Parlays) Table
create table public.bundles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  wager numeric not null,
  total_multiplier numeric not null,
  status text check (status in ('PENDING', 'WON', 'LOST')) default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bundle Legs (Individual Predictions in a Parlay)
create table public.bundle_legs (
  id uuid default uuid_generate_v4() primary key,
  bundle_id uuid references public.bundles on delete cascade not null,
  prediction_id uuid references public.predictions not null,
  side text check (side in ('YES', 'NO')) not null,
  multiplier numeric not null
);

-- RLS for Bundles
alter table public.bundles enable row level security;
create policy "Bundles are viewable by everyone." on public.bundles for select using (true);
create policy "Users can insert their own bundles." on public.bundles for insert with check (auth.uid() = user_id);

-- RLS for Bundle Legs
alter table public.bundle_legs enable row level security;
create policy "Bundle legs are viewable by everyone." on public.bundle_legs for select using (true);
create policy "Users can insert their own bundle legs." on public.bundle_legs for insert with check (
  exists (
    select 1 from public.bundles 
    where id = bundle_id and user_id = auth.uid()
  )
);
