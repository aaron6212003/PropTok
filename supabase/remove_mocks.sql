
-- Removes all placeholder/mock data from the predictions table
-- Targets IDs starting with 'mock-' or 'manual-seed-'

DELETE FROM predictions
WHERE external_id LIKE 'mock-%' 
   OR external_id LIKE 'manual-seed-%'
   OR question LIKE 'Will Kansas City Chiefs win against Baltimore Ravens%';
