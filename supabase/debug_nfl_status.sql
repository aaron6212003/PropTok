-- DUMP 1: Check if the tournament exists
SELECT id, name, status, owner_id, is_public FROM public.tournaments WHERE name ILIKE '%NFL%';

-- DUMP 2: Check for ANY transactions related to NFL to see if we can recover users
SELECT * FROM public.transactions WHERE description ILIKE '%NFL%' OR description ILIKE '%Tournament%';

-- DUMP 3: Check current entries for that tournament (if it exists)
SELECT * FROM public.tournament_entries 
WHERE tournament_id IN (SELECT id FROM public.tournaments WHERE name ILIKE '%NFL%');
