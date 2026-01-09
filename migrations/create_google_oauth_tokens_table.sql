-- ============================================================================
-- GOOGLE OAUTH TOKENS TABLE - SQL Migration for Supabase
-- ============================================================================
-- This migration creates the google_oauth_tokens table for storing OAuth 2.0
-- tokens used to authenticate with Google Drive for automated backups.
--
-- To apply: Copy and paste this into Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- Create google_oauth_tokens table
CREATE TABLE IF NOT EXISTS "google_oauth_tokens" (
  "id" SERIAL NOT NULL,
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "scope" TEXT NOT NULL,
  "email" VARCHAR(255),
  "created_by" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "google_oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- Create auto-update trigger for updated_at field
CREATE OR REPLACE FUNCTION update_google_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_google_oauth_tokens_updated_at_trigger ON google_oauth_tokens;
CREATE TRIGGER update_google_oauth_tokens_updated_at_trigger
BEFORE UPDATE ON google_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION update_google_oauth_tokens_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to verify everything is set up:

-- 1. Verify google_oauth_tokens table exists
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'google_oauth_tokens'
-- ORDER BY ordinal_position;

-- 2. Verify trigger exists
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name = 'update_google_oauth_tokens_updated_at_trigger';

-- ============================================================================
-- ROLLBACK (Optional - use only if you need to remove OAuth integration)
-- ============================================================================
-- CAUTION: This will delete all OAuth tokens and drop the table

-- DROP TABLE IF EXISTS google_oauth_tokens CASCADE;
-- DROP FUNCTION IF EXISTS update_google_oauth_tokens_updated_at() CASCADE;
