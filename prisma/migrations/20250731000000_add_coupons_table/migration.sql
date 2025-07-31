-- Migration: 20250731000000_add_coupons_table
-- Description: Add coupons table and related functionality

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minimum_amount" DECIMAL(10,2),
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "idx_coupons_code" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "idx_coupons_active" ON "coupons"("is_active");

-- CreateIndex
CREATE INDEX "idx_coupons_valid_from" ON "coupons"("valid_from");

-- CreateIndex
CREATE INDEX "idx_coupons_valid_until" ON "coupons"("valid_until");

-- CreateIndex
CREATE INDEX "idx_coupons_created_by" ON "coupons"("created_by");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add coupon_id column to sales_items table
ALTER TABLE "sales_items" ADD COLUMN "coupon_id" INTEGER;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE; 