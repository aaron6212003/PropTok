-- Reset all user cash balances to 0
UPDATE auth.users SET raw_user_meta_data = 
  jsonb_set(raw_user_meta_data, '{cash_balance}', '0', true);

UPDATE public.users SET cash_balance = 0;
