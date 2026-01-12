
-- Ensure predictions are readable by everyone (anon and authenticated)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Predictions"
ON predictions FOR SELECT
USING (true);

-- Also ensure comments are readable
CREATE POLICY "Public Read Comments"
ON comments FOR SELECT
USING (true);
