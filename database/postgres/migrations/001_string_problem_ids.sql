-- Migration: support string problem IDs from external platforms (Kattis, Codeforces)
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_problem_id_fkey;
ALTER TABLE submissions ALTER COLUMN problem_id TYPE VARCHAR(100) USING problem_id::VARCHAR;
