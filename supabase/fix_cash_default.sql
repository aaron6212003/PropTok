-- FIX CASH DEFAULTS
-- 1. Change default for new users to 0
ALTER TABLE users ALTER COLUMN cash_balance SET DEFAULT 0;

-- 2. Reset EXISTING users (who are not Admin/Bank) to 0
-- Assuming ID 0000... is the Bank/System, keep it if it has money, or reset it too if that's preferred.
-- Usually we don't want to wipe the Bank's liquidity if it's holding funds, but for a "Fresh Start" 0 is fine.
-- SAFE MODE: Reset everyone.
UPDATE users SET cash_balance = 0;

-- 3. Verify
SELECT id, username, cash_balance FROM users LIMIT 10;
