-- 1. Reset all users' cash_balance to 0 (Wipe mock data)
UPDATE public.users 
SET cash_balance = 0;

-- 2. Restore "NFL Weekend" Tournament to Featured (System Owned)
-- We identify it by name. If multiple exist, we update all of them or just one.
UPDATE public.tournaments
SET 
    owner_id = NULL, -- Make it "System Owned" (Featured)
    status = 'ACTIVE', -- Ensure it is visible
    entry_fee = 10, -- Ensure it has a valid entry fee
    starting_stack = 1000 -- Ensure valid stack
WHERE name ILIKE '%NFL Weekend%';

-- 3. Log this administrative action (Optional but good practice)
INSERT INTO public.transactions (user_id, amount, type, description)
SELECT id, 0, 'ADMIN_RESET', 'Global Economy Reset'
FROM public.users;
