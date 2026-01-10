-- FORCE CASCADE MIGRATION
-- This script ensures that deleting a prediction automatically removes all related data:
-- 1. Votes
-- 2. Comments
-- 3. Bundle Legs (which are parts of parlays)

BEGIN;

-- 1. VOTES
ALTER TABLE public.votes 
DROP CONSTRAINT IF EXISTS votes_prediction_id_fkey;

ALTER TABLE public.votes 
ADD CONSTRAINT votes_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;

-- 2. COMMENTS
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_prediction_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;

-- 3. BUNDLE LEGS
ALTER TABLE public.bundle_legs 
DROP CONSTRAINT IF EXISTS bundle_legs_prediction_id_fkey;

ALTER TABLE public.bundle_legs 
ADD CONSTRAINT bundle_legs_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;

COMMIT;
