-- Hard Reset of Real Cash Balances
-- This sets everyone's withdrawable cash to $0.
UPDATE public.users SET cash_balance = 0;

-- Optional: If you want to clear transaction history too, uncomment below:
-- TRUNCATE public.transactions;
