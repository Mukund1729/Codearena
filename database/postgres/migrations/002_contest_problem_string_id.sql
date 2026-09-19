-- Migration: support string problem IDs in contest_problems table
ALTER TABLE contest_problems ALTER COLUMN problem_id TYPE VARCHAR(100) USING problem_id::VARCHAR;
