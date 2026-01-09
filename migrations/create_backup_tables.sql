-- ============================================================================
-- BACKUP SYSTEM TABLES - SQL Migration for Supabase
-- ============================================================================
-- This migration creates the backup_logs table and related enums for the
-- automated database backup system.
--
-- To apply: Copy and paste this into Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- Create BackupStatus enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "BackupStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'PARTIAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create BackupTrigger enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "BackupTrigger" AS ENUM (
    'MANUAL',
    'SCHEDULED',
    'API'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create backup_logs table
CREATE TABLE IF NOT EXISTS "backup_logs" (
  "id" SERIAL NOT NULL,
  "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
  "trigger_type" "BackupTrigger" NOT NULL,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  "file_size" BIGINT,
  "tables_count" INTEGER,
  "records_count" JSONB,
  "drive_file_id" VARCHAR(255),
  "drive_file_url" VARCHAR(500),
  "error_message" TEXT,
  "metadata" JSONB,
  "created_by" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "backup_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_backup_logs_status" ON "backup_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_backup_logs_trigger_type" ON "backup_logs"("trigger_type");
CREATE INDEX IF NOT EXISTS "idx_backup_logs_started_at" ON "backup_logs"("started_at");
CREATE INDEX IF NOT EXISTS "idx_backup_logs_created_by" ON "backup_logs"("created_by");

-- Add foreign key constraint for created_by (references users table)
DO $$ BEGIN
  ALTER TABLE "backup_logs" ADD CONSTRAINT "backup_logs_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create auto-update trigger for updated_at field
CREATE OR REPLACE FUNCTION update_backup_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_backup_logs_updated_at_trigger ON backup_logs;
CREATE TRIGGER update_backup_logs_updated_at_trigger
BEFORE UPDATE ON backup_logs
FOR EACH ROW
EXECUTE FUNCTION update_backup_logs_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to verify everything is set up:

-- 1. Verify backup_logs table exists
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'backup_logs'
-- ORDER BY ordinal_position;

-- 2. Verify enums exist
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'BackupStatus'::regtype
-- ORDER BY enumsortorder;

-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'BackupTrigger'::regtype
-- ORDER BY enumsortorder;

-- 3. Verify indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'backup_logs';

-- 4. Verify trigger exists
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name = 'update_backup_logs_updated_at_trigger';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert a test backup log entry:

-- INSERT INTO backup_logs (
--   status,
--   trigger_type,
--   started_at,
--   completed_at,
--   file_size,
--   tables_count,
--   records_count,
--   metadata
-- ) VALUES (
--   'COMPLETED',
--   'MANUAL',
--   NOW(),
--   NOW() + INTERVAL '30 seconds',
--   1048576, -- 1 MB
--   25,
--   '{"users": 10, "products": 100}'::jsonb,
--   '{"version": "1.0.0", "totalRecords": 110}'::jsonb
-- );

-- ============================================================================
-- ROLLBACK (Optional - use only if you need to remove the backup system)
-- ============================================================================
-- CAUTION: This will delete all backup logs and drop the table

-- DROP TABLE IF EXISTS backup_logs CASCADE;
-- DROP TYPE IF EXISTS "BackupStatus";
-- DROP TYPE IF EXISTS "BackupTrigger";
-- DROP FUNCTION IF EXISTS update_backup_logs_updated_at() CASCADE;
