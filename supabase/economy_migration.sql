-- Add Bankroll to Users
alter table public.users add column if not exists bankroll numeric default 1000;

-- Add Wager and Multiplier to Votes
alter table public.votes add column if not exists wager numeric default 0;
alter table public.votes add column if not exists payout_multiplier numeric default 2.0;

-- Initialize existing users
update public.users set bankroll = 1000 where bankroll is null;
