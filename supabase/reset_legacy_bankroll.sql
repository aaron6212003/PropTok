-- Force reset all legacy bankrolls (Global Chips) to 0
-- This ensures no one sees the "$1,000" default anymore.
UPDATE public.users SET bankroll = 0;

-- Optional: Ensure default for new users is 0 (if not already set in schema)
ALTER TABLE public.users ALTER COLUMN bankroll SET DEFAULT 0;
