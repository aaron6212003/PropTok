-- ENFORCE $0 CASH DEFAULT
-- This ensures every NEW user starts with $0.

BEGIN;

-- 1. Alter the table to set default to 0
ALTER TABLE users
ALTER COLUMN cash_balance SET DEFAULT 0;

-- 2. Validate existing users (optional, but good for cleanliness)
-- UPDATE users SET cash_balance = 0 WHERE cash_balance IS NULL;

COMMIT;
