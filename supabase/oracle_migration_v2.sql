-- Add Text Target for Sports (e.g. 'steelers')
alter table public.predictions add column if not exists target_slug text;

comment on column public.predictions.target_slug is 'The text value to match (e.g. steelers, under, yes)';
