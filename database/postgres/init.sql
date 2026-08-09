-- CodeArena PostgreSQL Database Schema
-- This script initializes all tables for the CodeArena platform

-- Users table for seeded admin/test accounts
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    sample_input TEXT,
    sample_output TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    tags TEXT,
    time_limit INTEGER NOT NULL,
    memory_limit INTEGER NOT NULL,
    total_test_cases INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    points INTEGER NOT NULL,
    acceptance_rate INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL
);

-- Indexes for problems
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING gin(to_tsvector('english', tags));
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    test_case_number INTEGER NOT NULL,
    input_s3_key VARCHAR(500) NOT NULL,
    output_s3_key VARCHAR(500) NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    points INTEGER NOT NULL,
    is_hidden BOOLEAN DEFAULT TRUE,
    UNIQUE(problem_id, test_case_number)
);

-- Editorials table
CREATE TABLE IF NOT EXISTS editorials (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER UNIQUE NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    explanation TEXT,
    approach TEXT,
    algorithm TEXT,
    complexity TEXT,
    code TEXT,
    hints TEXT,
    pdf_s3_key VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contests table
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UPCOMING', 'ACTIVE', 'ENDED', 'ARCHIVED')),
    duration_minutes INTEGER NOT NULL,
    scoring_formula VARCHAR(100),
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL
);

-- Contest problems table
CREATE TABLE IF NOT EXISTS contest_problems (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL,
    problem_order INTEGER NOT NULL,
    points INTEGER NOT NULL,
    UNIQUE(contest_id, problem_id)
);

-- Contest participants table
CREATE TABLE IF NOT EXISTS contest_participants (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_participants_contest_user ON contest_participants(contest_id, user_id);

-- Submissions table (problem_id supports external platform IDs like "hello", "1000A")
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    submission_id VARCHAR(36) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    problem_id VARCHAR(100) NOT NULL,
    contest_id INTEGER REFERENCES contests(id),
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    result VARCHAR(50),
    error_message TEXT,
    execution_time INTEGER,
    memory_used INTEGER,
    test_cases_passed INTEGER,
    total_test_cases INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem ON submissions(user_id, problem_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_contest ON submissions(contest_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);

-- Solution embeddings table for plagiarism detection
CREATE TABLE IF NOT EXISTS solution_embeddings (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    code TEXT NOT NULL,
    embedding real[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_id, user_id)
);

-- Index for similarity search
CREATE INDEX IF NOT EXISTS idx_solution_embeddings_problem_id ON solution_embeddings(problem_id);

-- Insert sample data
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editorials_updated_at BEFORE UPDATE ON editorials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
