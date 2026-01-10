-- FORCE RESET YOUR BALANCE
-- Replace 'YOUR_EMAIL' if you know it, otherwise this resets EVERYONE who isn't the bank.

UPDATE users
SET cash_balance = 0
WHERE id NOT IN (
    '00000000-0000-0000-0000-000000000000' -- System Bank
);
