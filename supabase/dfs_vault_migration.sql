
-- 1. THE LEDGER (Transactions Table)
create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) not null,
    amount numeric not null, -- Positive for Credit, Negative for Debit
    type text check (type in ('DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'PRIZE_PAYOUT', 'ADJUSTMENT')) not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Transactions
alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
-- No insert policy for users (Security Critical: Only Server Actions can insert transactions)

-- 2. USER BALANCES (Real Money vs Promo)
alter table public.users add column if not exists cash_balance numeric default 0;
alter table public.users add column if not exists promo_balance numeric default 0;

-- 3. TOURNAMENT POTS
alter table public.tournaments add column if not exists pot_size numeric default 0;
alter table public.tournaments add column if not exists host_rake_percent numeric default 10; -- Default 10% rake
alter table public.tournaments add column if not exists payout_status text default 'UNPAID'; -- 'UNPAID', 'PROCESSING', 'PAID'

-- 4. TOURNAMENT PARTICIPANTS (If not already tracking stack per user)
-- Ensuring we can track who is in a tournament and their stack
create table if not exists public.tournament_participants (
    tournament_id uuid references public.tournaments(id) not null,
    user_id uuid references public.users(id) not null,
    stack numeric default 1000, -- The "500 play money" user mentioned
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (tournament_id, user_id)
);

-- RLS
alter table public.tournament_participants enable row level security;
create policy "Public view participants" on public.tournament_participants for select using (true);
