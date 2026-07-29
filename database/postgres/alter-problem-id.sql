-- Alter script to support string problem IDs (for Codeforces & Kattis)
-- Run this in your PostgreSQL database

-- Remove foreign key constraint to allow external problem IDs
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_problem_id_fkey;

-- Change column type from INTEGER to VARCHAR(100)
ALTER TABLE submissions ALTER COLUMN problem_id TYPE VARCHAR(100);

-- Note: If you have existing integer problem IDs, they will be automatically converted to strings
