-- Tournaments Table
create table public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g. "NFL Sunday Clash"
  description text,
  entry_fee numeric default 100, -- Cost to enter (PropCash)
  starting_stack numeric default 500, -- Tournament chips
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('UPCOMING', 'ACTIVE', 'COMPLETED')) default 'UPCOMING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tournament Entries (Links User to Tournament + their Chip Count)
create table public.tournament_entries (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments not null,
  user_id uuid references public.users not null,
  current_stack numeric not null, -- Their tournament bankroll
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tournament_id, user_id)
);

-- RLS
alter table public.tournaments enable row level security;
create policy "Tournaments are viewable by everyone." on public.tournaments for select using (true);

alter table public.tournament_entries enable row level security;
create policy "Entries are viewable by everyone." on public.tournament_entries for select using (true);
create policy "Users can join." on public.tournament_entries for insert with check (auth.uid() = user_id);

-- Add 'tournament_id' to Votes to track which pool it belongs to
alter table public.votes add column if not exists tournament_id uuid references public.tournaments;

-- Seed a Demo Tournament
insert into public.tournaments (name, description, start_time, end_time, status)
values (
    'Weekly Whale War', 
    'Start with $500. Highest balance wins.', 
    now(), 
    now() + interval '7 days', 
    'ACTIVE'
);
