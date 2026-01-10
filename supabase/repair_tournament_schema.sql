-- PERMANENT FIX: TOURNAMENT SCHEMA & CASH
-- Run this in Supabase SQL Editor

-- 1. FIX TOURNAMENTS: Make start_time optional (Defaults to NOW)
ALTER TABLE public.tournaments 
ALTER COLUMN start_time SET DEFAULT now();

ALTER TABLE public.tournaments 
ALTER COLUMN start_time DROP NOT NULL;

-- 2. FORCE CASH RESET (Again)
UPDATE public.users SET cash_balance = 0;

-- 3. VERIFY: This returns the number of users with cash > 0 (Should be 0)
SELECT count(*) as "Users With Cash Remaining" FROM public.users WHERE cash_balance > 0;
