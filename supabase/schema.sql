-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- RESET (Caution: Deletes all data)
drop table if exists public.votes;
drop table if exists public.predictions;
drop table if exists public.users;

-- USERS TABLE (Syncs with Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  win_rate numeric default 0,
  streak integer default 0,
  best_streak integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Users
alter table public.users enable row level security;
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- PREDICTIONS TABLE
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  category text not null, -- 'Sports', 'Crypto', etc.
  description text,
  image_url text,
  
  -- Market Data
  yes_percent integer default 50,
  volume integer default 0,
  yes_multiplier numeric default 1.9,
  no_multiplier numeric default 1.9,
  
  resolved boolean default false,
  outcome text check (outcome in ('YES', 'NO', 'VOID')),
  
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Predictions
alter table public.predictions enable row level security;
create policy "Predictions are viewable by everyone." on public.predictions for select using (true);
-- Only service role can insert/update (for now)

-- VOTES TABLE
create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  prediction_id uuid references public.predictions not null,
  side text check (side in ('YES', 'NO')) not null,
  amount integer default 1, -- Virtual currency amount (future proofing)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, prediction_id) -- One vote per prediction per user
);

-- RLS for Votes
alter table public.votes enable row level security;
create policy "Votes are viewable by everyone." on public.votes for select using (true);
create policy "Users can insert their own votes." on public.votes for insert with check (auth.uid() = user_id);

-- TRIGGER: Create Profile on Signup
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
