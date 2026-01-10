-- Check for any tournament resembling NFL
SELECT id, name, owner_id, status, is_public FROM public.tournaments WHERE name ILIKE '%NFL%';

-- Check entries for any NFL tournament found above (if any)
SELECT * FROM public.tournament_entries 
WHERE tournament_id IN (SELECT id FROM public.tournaments WHERE name ILIKE '%NFL%');
