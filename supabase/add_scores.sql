
-- Add score and status columns to predictions table
ALTER TABLE predictions 
ADD COLUMN IF NOT EXISTS home_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'; -- "scheduled", "live", "final"

-- Index for live lookups
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
