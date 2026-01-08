-- Add Prop Columns
alter table public.predictions add column if not exists prop_type text; -- e.g. 'player_pass_tds'
alter table public.predictions add column if not exists line numeric; -- e.g. 2.5 (The betting line)
alter table public.predictions add column if not exists player_name text; -- e.g. 'Patrick Mahomes'

comment on column public.predictions.prop_type is 'The type of statistic to check (e.g. player_pass_yds, player_sacks)';
comment on column public.predictions.line is 'The handbook line for the over/under';
