-- REMOVE END TIME CONSTRAINT
-- Run this in Supabase SQL Editor

-- Allow end_time to be NULL (No specific end time)
ALTER TABLE public.tournaments 
ALTER COLUMN end_time DROP NOT NULL;
