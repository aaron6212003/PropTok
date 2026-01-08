-- Seed Predictions
insert into public.predictions (question, category, outcome, expires_at)
values
  ('Will the Chiefs win the Super Bowl?', 'Sports', null, now() + interval '1 month'),
  ('Will Bitcoin hit $100k in 2025?', 'Crypto', null, now() + interval '1 year'),
  ('Will Taylor Swift release a new album in Q1?', 'Pop Culture', null, now() + interval '3 months'),
  ('Will it rain in London tomorrow?', 'Weather', null, now() + interval '1 day'),
  ('Will SpaceX launch Starship this week?', 'Tech', null, now() + interval '7 days');
