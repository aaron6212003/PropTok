-- Add max_players to tournaments
-- If NULL, it means "Unlimited"

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT NULL;

-- Optional constraint to ensure it's positive if set
ALTER TABLE public.tournaments
ADD CONSTRAINT check_positive_max_players CHECK (max_players IS NULL OR max_players > 1);
