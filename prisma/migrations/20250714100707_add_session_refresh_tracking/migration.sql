-- AlterTable
ALTER TABLE "users" ADD COLUMN     "session_needs_refresh" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "session_refresh_at" TIMESTAMPTZ(6);
