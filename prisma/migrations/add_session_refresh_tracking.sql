-- Add session refresh tracking fields
ALTER TABLE users ADD COLUMN session_needs_refresh BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN session_refresh_at TIMESTAMPTZ NULL;

-- Create index for performance
CREATE INDEX idx_users_session_needs_refresh ON users(session_needs_refresh); 