-- Add updated_at column to users table if it doesn't exist
alter table public.users
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Initial backfill
update public.users
set updated_at = created_at
where updated_at is null;
