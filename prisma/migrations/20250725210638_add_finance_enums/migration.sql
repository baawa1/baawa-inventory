/*
  Warnings:

  - You are about to drop the column `expense_type` on the `expense_details` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `financial_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `income_source` on the `income_details` table. All the data in the column will be lost.
  - Added the required column `expenseType` to the `expense_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incomeSource` to the `income_details` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'POS_MACHINE', 'CREDIT_CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('INVENTORY_PURCHASES', 'UTILITIES', 'RENT', 'SALARIES', 'MARKETING', 'OFFICE_SUPPLIES', 'TRAVEL', 'INSURANCE', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('SALES', 'SERVICES', 'INVESTMENTS', 'ROYALTIES', 'COMMISSIONS', 'OTHER');

-- AlterTable
ALTER TABLE "expense_details" DROP COLUMN "expense_type",
ADD COLUMN     "expenseType" "ExpenseType" NOT NULL;

-- AlterTable
ALTER TABLE "financial_transactions" DROP COLUMN "payment_method",
ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "income_details" DROP COLUMN "income_source",
ADD COLUMN     "incomeSource" "IncomeSource" NOT NULL;
