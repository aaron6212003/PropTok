-- FORCE VISIBILITY FIX
-- Run this in Supabase SQL Editor

-- 1. Make ALL Tournaments Featured & Active
UPDATE public.tournaments
SET 
  owner_id = NULL,
  status = 'ACTIVE',
  start_time = now(),
  filter_category = 'All';

-- 2. Verify
SELECT id, name, owner_id, status FROM public.tournaments;
