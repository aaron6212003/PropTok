create table public.tournament_payouts (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments not null,
  winner_user_id uuid references public.users not null,
  pool_cents integer not null,
  winner_cents integer not null, -- 90% typically
  host_cents integer not null, -- 5% typically
  platform_cents integer not null, -- 5% typically
  status text check (status in ('PENDING', 'COMPLETED', 'FAILED')) default 'PENDING',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.tournament_payouts enable row level security;
create policy "Payouts viewable by everyone" on public.tournament_payouts for select using (true);
