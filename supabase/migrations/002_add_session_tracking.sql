-- Add session tracking fields to users table
-- Migration: Add last_logout and last_activity fields for session management

-- Add last_logout column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_logout TIMESTAMPTZ;

-- Add last_activity column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;

-- Create index on last_activity for performance
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- Create index on last_login for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Comment on new columns
COMMENT ON COLUMN users.last_logout IS 'Timestamp when user last logged out';
COMMENT ON COLUMN users.last_activity IS 'Timestamp of user last activity/session update';
