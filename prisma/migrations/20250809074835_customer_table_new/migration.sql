/*
  Warnings:

  - You are about to drop the column `customer_email` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `customer_name` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `customer_phone` on the `sales_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sales_transactions" DROP COLUMN "customer_email",
DROP COLUMN "customer_name",
DROP COLUMN "customer_phone";
