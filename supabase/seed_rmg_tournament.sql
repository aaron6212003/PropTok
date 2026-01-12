-- Seed a $10 Real Money Tournament for Testing
-- Run this in your Supabase SQL Editor

INSERT INTO public.tournaments (
    name, 
    description, 
    entry_fee_cents, 
    starting_stack, 
    status,
    max_players,
    start_time, 
    end_time
) VALUES (
    'High Roller Open ($10)', 
    'Official test tournament with specific $10 entry fee. Winner takes 90%.',
    1000, -- $10.00
    500,  -- 500 Chips Stack
    'ACTIVE',
    100,
    NOW(),
    NOW() + interval '7 days'
);
