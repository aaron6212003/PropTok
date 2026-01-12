-- Set default cash_balance to 0.00 for new users
ALTER TABLE users 
ALTER COLUMN cash_balance SET DEFAULT 0.00;

-- Reset all users to 0.00 unless they have a history of promo code redemption?
-- For now, the user said "everyone should have zero... unless they used a promo code".
-- Since there are no promo codes yet, resetting EVERYONE to 0.00 is safe and correct per instruction.
UPDATE users SET cash_balance = 0.00;
