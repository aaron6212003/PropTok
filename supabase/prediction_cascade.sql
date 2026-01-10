-- Add ON DELETE CASCADE to foreign keys referencing public.predictions

-- 1. Public.Votes
ALTER TABLE public.votes 
DROP CONSTRAINT IF EXISTS votes_prediction_id_fkey;

ALTER TABLE public.votes 
ADD CONSTRAINT votes_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;

-- 2. Public.Bundle_Legs (if exists)
ALTER TABLE public.bundle_legs 
DROP CONSTRAINT IF EXISTS bundle_legs_prediction_id_fkey;

ALTER TABLE public.bundle_legs 
ADD CONSTRAINT bundle_legs_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;

-- 3. Public.Comments (if exists)
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_prediction_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;
