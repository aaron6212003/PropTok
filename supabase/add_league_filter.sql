-- Add league filtering to tournaments
alter table public.tournaments 
add column if not exists allowed_leagues text[] default null; 

-- Example: Update existing High Roller tournament to be NFL Only
update public.tournaments 
set allowed_leagues = ARRAY['NFL'] 
where name ilike '%High Roller%';
