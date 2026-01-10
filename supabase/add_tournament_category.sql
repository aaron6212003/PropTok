-- Add Category Filter to Tournaments
-- Allows tournaments to be specific to "NFL", "NBA", etc.

ALTER TABLE public.tournaments 
ADD COLUMN filter_category text DEFAULT 'All'; 

-- Comment: 'All' means no filter (Global). Specific string means filter by that category.
