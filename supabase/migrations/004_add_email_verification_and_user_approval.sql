-- Add email verification and user approval fields to users table
-- Migration: 004_add_email_verification_and_user_approval.sql

-- Add email verification fields
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMPTZ NULL;

-- Add user approval workflow fields
ALTER TABLE users ADD COLUMN user_status VARCHAR(20) DEFAULT 'PENDING' CHECK (user_status IN ('PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'SUSPENDED'));
ALTER TABLE users ADD COLUMN approved_by INTEGER NULL;
ALTER TABLE users ADD COLUMN approved_at TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN rejection_reason TEXT NULL;

-- Add email preferences
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN marketing_emails BOOLEAN DEFAULT FALSE;

-- Add foreign key constraint for approver
ALTER TABLE users ADD CONSTRAINT users_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_user_status ON users(user_status);
CREATE INDEX idx_users_approved_by ON users(approved_by);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Update existing users to be approved (migration safety)
UPDATE users SET 
  user_status = 'APPROVED',
  email_verified = TRUE,
  email_verified_at = created_at,
  approved_at = created_at
WHERE user_status = 'PENDING';

-- Add comments for documentation
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.user_status IS 'Current status in the user approval workflow';
COMMENT ON COLUMN users.approved_by IS 'ID of admin who approved/rejected the user';
COMMENT ON COLUMN users.email_notifications IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN users.marketing_emails IS 'Whether user wants to receive marketing emails';
