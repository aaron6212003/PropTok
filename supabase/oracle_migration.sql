-- Add Oracle Columns to Predictions Table
alter table public.predictions add column if not exists oracle_id text; -- e.g. 'bitcoin'
alter table public.predictions add column if not exists oracle_type text; -- e.g. 'price_gt' (greater than)
alter table public.predictions add column if not exists target_value numeric; -- e.g. 95000

comment on column public.predictions.oracle_id is 'The ID of the asset or game to watch (e.g. bitcoin, lakers-warriors)';
comment on column public.predictions.oracle_type is 'The condition to check (price_gt, game_winner)';
