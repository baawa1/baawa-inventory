-- AlterTable
ALTER TABLE "products" ADD COLUMN     "last_sync_at" TIMESTAMPTZ(6),
ADD COLUMN     "sync_errors" TEXT,
ADD COLUMN     "sync_status" VARCHAR(20) DEFAULT 'pending';
