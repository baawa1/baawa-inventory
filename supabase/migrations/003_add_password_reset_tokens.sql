-- Migration: Add password reset token fields to users table
-- Date: 2025-06-23

-- Add reset token fields to users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMPTZ;

-- Add index for reset token lookup
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
