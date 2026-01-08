-- Add acknowledged field to track seen results for cinematic recaps
alter table public.votes add column if not exists acknowledged boolean default false;
alter table public.bundles add column if not exists acknowledged boolean default false;

-- Add index for performance on fetching unacknowledged results
create index if not exists idx_votes_unacknowledged on public.votes(user_id) where acknowledged = false;
create index if not exists idx_bundles_unacknowledged on public.bundles(user_id) where acknowledged = false;
