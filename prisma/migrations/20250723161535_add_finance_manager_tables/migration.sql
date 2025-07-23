-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BudgetPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "FinancialType" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" SERIAL NOT NULL,
    "transaction_number" VARCHAR(50) NOT NULL,
    "type" "FinancialType" NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "description" TEXT,
    "transaction_date" DATE NOT NULL,
    "payment_method" VARCHAR(50),
    "reference_number" VARCHAR(100),
    "status" "FinancialStatus" NOT NULL DEFAULT 'COMPLETED',
    "approved_by" INTEGER,
    "approved_at" TIMESTAMPTZ(6),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_details" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "expense_type" VARCHAR(50) NOT NULL,
    "vendor_name" VARCHAR(255),
    "vendor_contact" VARCHAR(255),
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "receipt_url" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_details" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "income_source" VARCHAR(100) NOT NULL,
    "payer_name" VARCHAR(255),
    "payer_contact" VARCHAR(255),
    "tax_withheld" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "receipt_url" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category_id" INTEGER,
    "amount" DECIMAL(15,2) NOT NULL,
    "period_type" "BudgetPeriodType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" SERIAL NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "report_name" VARCHAR(255) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "report_data" JSONB NOT NULL,
    "generated_by" INTEGER NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" VARCHAR(500),

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_financial_categories_type" ON "financial_categories"("type");

-- CreateIndex
CREATE INDEX "idx_financial_categories_active" ON "financial_categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_transaction_number_key" ON "financial_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_type" ON "financial_transactions"("type");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_date" ON "financial_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_status" ON "financial_transactions"("status");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_category" ON "financial_transactions"("category_id");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_created_by" ON "financial_transactions"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "expense_details_transaction_id_key" ON "expense_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_details_transaction_id_key" ON "income_details"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_budgets_category" ON "budgets"("category_id");

-- CreateIndex
CREATE INDEX "idx_budgets_period_type" ON "budgets"("period_type");

-- CreateIndex
CREATE INDEX "idx_budgets_start_date" ON "budgets"("start_date");

-- CreateIndex
CREATE INDEX "idx_budgets_created_by" ON "budgets"("created_by");

-- CreateIndex
CREATE INDEX "idx_financial_reports_type" ON "financial_reports"("report_type");

-- CreateIndex
CREATE INDEX "idx_financial_reports_period_start" ON "financial_reports"("period_start");

-- CreateIndex
CREATE INDEX "idx_financial_reports_generated_by" ON "financial_reports"("generated_by");

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_details" ADD CONSTRAINT "expense_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
