/*
  Warnings:

  - You are about to drop the column `notes` on the `expense_details` table. All the data in the column will be lost.
  - You are about to drop the column `receipt_url` on the `expense_details` table. All the data in the column will be lost.
  - You are about to drop the column `tax_amount` on the `expense_details` table. All the data in the column will be lost.
  - You are about to drop the column `tax_rate` on the `expense_details` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_contact` on the `expense_details` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `financial_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_number` on the `financial_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `income_details` table. All the data in the column will be lost.
  - You are about to drop the column `payer_contact` on the `income_details` table. All the data in the column will be lost.
  - You are about to drop the column `receipt_url` on the `income_details` table. All the data in the column will be lost.
  - You are about to drop the column `tax_rate` on the `income_details` table. All the data in the column will be lost.
  - You are about to drop the column `tax_withheld` on the `income_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expense_details" DROP COLUMN "notes",
DROP COLUMN "receipt_url",
DROP COLUMN "tax_amount",
DROP COLUMN "tax_rate",
DROP COLUMN "vendor_contact";

-- AlterTable
ALTER TABLE "financial_transactions" DROP COLUMN "currency",
DROP COLUMN "reference_number";

-- AlterTable
ALTER TABLE "income_details" DROP COLUMN "notes",
DROP COLUMN "payer_contact",
DROP COLUMN "receipt_url",
DROP COLUMN "tax_rate",
DROP COLUMN "tax_withheld";
