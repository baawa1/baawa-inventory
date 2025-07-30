-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "stock_reconciliation_status" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'POS_MACHINE', 'CREDIT_CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('INVENTORY_PURCHASES', 'UTILITIES', 'RENT', 'SALARIES', 'MARKETING', 'OFFICE_SUPPLIES', 'TRAVEL', 'INSURANCE', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('SALES', 'SERVICES', 'INVESTMENTS', 'ROYALTIES', 'COMMISSIONS', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMPTZ(6),
    "last_logout" TIMESTAMPTZ(6),
    "last_activity" TIMESTAMPTZ(6),
    "reset_token" VARCHAR(255),
    "reset_token_expires" TIMESTAMPTZ(6),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ(6),
    "email_verification_token" VARCHAR(255),
    "email_verification_expires" TIMESTAMPTZ(6),
    "approved_by" INTEGER,
    "approved_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "email_notifications" BOOLEAN DEFAULT true,
    "marketing_emails" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "avatar_url" TEXT,
    "permissions" TEXT[],
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "user_status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "session_needs_refresh" BOOLEAN NOT NULL DEFAULT false,
    "session_refresh_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_person" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) DEFAULT 'Canada',
    "website" VARCHAR(255),
    "tax_number" VARCHAR(100),
    "payment_terms" VARCHAR(100),
    "credit_limit" DECIMAL(15,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent_id" INTEGER,
    "image" VARCHAR(500),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "website" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "image" VARCHAR(500),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "sku" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(100),
    "cost" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "max_stock" INTEGER,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'piece',
    "weight" DECIMAL(8,3),
    "dimensions" VARCHAR(100),
    "color" VARCHAR(50),
    "size" VARCHAR(50),
    "material" VARCHAR(100),
    "has_variants" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "seo_keywords" TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "supplier_id" INTEGER,
    "category_id" INTEGER,
    "brand_id" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "meta_content" TEXT,
    "meta_excerpt" TEXT,
    "sale_end_date" TIMESTAMPTZ(6),
    "sale_price" DECIMAL(10,2),
    "sale_start_date" TIMESTAMPTZ(6),
    "sort_order" INTEGER,
    "variant_attributes" JSONB,
    "variant_values" JSONB,
    "images" JSONB,
    "last_sync_at" TIMESTAMPTZ(6),
    "sync_errors" TEXT,
    "sync_status" VARCHAR(20) DEFAULT 'pending',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2),
    "color" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "dimensions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "material" VARCHAR(100),
    "max_stock_level" INTEGER,
    "min_stock_level" INTEGER DEFAULT 0,
    "product_id" INTEGER NOT NULL,
    "size" VARCHAR(50),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(8,3),
    "images" JSONB,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_transactions" (
    "id" SERIAL NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "customer_email" VARCHAR(255),
    "customer_name" VARCHAR(255),
    "customer_phone" VARCHAR(20),
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_method" VARCHAR(50) NOT NULL,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "transaction_number" VARCHAR(50) NOT NULL,
    "transaction_type" VARCHAR(20) NOT NULL DEFAULT 'sale',
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_items" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "discount_amount" DECIMAL(10,2) DEFAULT 0,
    "product_id" INTEGER,
    "total_price" DECIMAL(10,2) NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "variant_id" INTEGER,

    CONSTRAINT "sales_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_payments" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_additions" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_per_unit" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "purchase_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "reference_no" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "product_id" INTEGER NOT NULL,
    "supplier_id" INTEGER,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "stock_additions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reconciliations" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "created_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "status" "stock_reconciliation_status" DEFAULT 'DRAFT',

    CONSTRAINT "stock_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reconciliation_items" (
    "id" SERIAL NOT NULL,
    "system_count" INTEGER NOT NULL,
    "physical_count" INTEGER NOT NULL,
    "discrepancy" INTEGER NOT NULL,
    "discrepancy_reason" TEXT,
    "estimated_impact" DECIMAL(10,2),
    "notes" TEXT,
    "reconciliation_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "stock_reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "adjustment_type" VARCHAR(50) NOT NULL,
    "approved_at" TIMESTAMPTZ(6),
    "approved_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "new_quantity" INTEGER NOT NULL,
    "old_quantity" INTEGER NOT NULL,
    "product_id" INTEGER,
    "reference_number" VARCHAR(100),
    "rejection_reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "variant_id" INTEGER,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "new_values" JSONB,
    "old_values" JSONB,
    "record_id" INTEGER,
    "table_name" VARCHAR(100) NOT NULL,
    "user_agent" TEXT,
    "user_id" INTEGER,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_content" (
    "id" SERIAL NOT NULL,
    "approved_at" TIMESTAMPTZ(6),
    "approved_by" INTEGER,
    "confidence_score" DECIMAL(3,2),
    "content_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "generated_content" TEXT NOT NULL,
    "is_approved" BOOLEAN DEFAULT false,
    "model_used" VARCHAR(100),
    "original_content" TEXT,
    "product_id" INTEGER NOT NULL,
    "prompt_used" TEXT,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_sync" (
    "id" SERIAL NOT NULL,
    "entity_type" VARCHAR(20) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "sync_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "last_sync_at" TIMESTAMPTZ(6),
    "sync_errors" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "webhook_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_blacklist" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "blacklisted_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" SERIAL NOT NULL,
    "transaction_number" VARCHAR(50) NOT NULL,
    "type" "FinancialType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "transaction_date" DATE NOT NULL,
    "paymentMethod" "PaymentMethod",
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
    "expenseType" "ExpenseType" NOT NULL,
    "vendor_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_details" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "incomeSource" "IncomeSource" NOT NULL,
    "payer_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_details_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_approved_by" ON "users"("approved_by");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email_verification_token" ON "users"("email_verification_token");

-- CreateIndex
CREATE INDEX "idx_users_email_verified" ON "users"("email_verified");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_last_activity" ON "users"("last_activity");

-- CreateIndex
CREATE INDEX "idx_users_last_login" ON "users"("last_login");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_user_status" ON "users"("user_status");

-- CreateIndex
CREATE INDEX "idx_suppliers_active" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "idx_suppliers_contact" ON "suppliers"("contact_person");

-- CreateIndex
CREATE INDEX "idx_suppliers_email" ON "suppliers"("email");

-- CreateIndex
CREATE INDEX "idx_suppliers_name" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "idx_categories_parent_id" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_parent_id_key" ON "categories"("name", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "idx_brands_is_active" ON "brands"("is_active");

-- CreateIndex
CREATE INDEX "idx_brands_name" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_products_sku" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "idx_products_stock" ON "products"("stock");

-- CreateIndex
CREATE INDEX "idx_products_supplier_id" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_products_is_featured" ON "products"("is_featured");

-- CreateIndex
CREATE INDEX "idx_products_sort_order" ON "products"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "idx_product_variants_product_id" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_variants_sku" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_transaction_number_key" ON "sales_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_created_at" ON "sales_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_payment_status" ON "sales_transactions"("payment_status");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_transaction_number" ON "sales_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_user_id" ON "sales_transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sales_items_product_id" ON "sales_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_sales_items_transaction_id" ON "sales_items"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_sales_items_variant_id" ON "sales_items"("variant_id");

-- CreateIndex
CREATE INDEX "idx_split_payments_transaction_id" ON "split_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_split_payments_payment_method" ON "split_payments"("payment_method");

-- CreateIndex
CREATE INDEX "idx_stock_additions_created_by" ON "stock_additions"("created_by");

-- CreateIndex
CREATE INDEX "idx_stock_additions_product_id" ON "stock_additions"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_additions_purchase_date" ON "stock_additions"("purchase_date");

-- CreateIndex
CREATE INDEX "idx_stock_additions_supplier_id" ON "stock_additions"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_approved_by" ON "stock_reconciliations"("approved_by");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_created_at" ON "stock_reconciliations"("created_at");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_created_by" ON "stock_reconciliations"("created_by");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_status" ON "stock_reconciliations"("status");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliation_items_product_id" ON "stock_reconciliation_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliation_items_reconciliation_id" ON "stock_reconciliation_items"("reconciliation_id");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_adjustment_type" ON "stock_adjustments"("adjustment_type");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_approved_by" ON "stock_adjustments"("approved_by");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_created_at" ON "stock_adjustments"("created_at");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_product_id" ON "stock_adjustments"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_status" ON "stock_adjustments"("status");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_user_id" ON "stock_adjustments"("user_id");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_variant_id" ON "stock_adjustments"("variant_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_record_id" ON "audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_table_name" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_ai_content_content_type" ON "ai_content"("content_type");

-- CreateIndex
CREATE INDEX "idx_ai_content_is_approved" ON "ai_content"("is_approved");

-- CreateIndex
CREATE INDEX "idx_ai_content_product_id" ON "ai_content"("product_id");

-- CreateIndex
CREATE INDEX "idx_content_sync_entity_type" ON "content_sync"("entity_type");

-- CreateIndex
CREATE INDEX "idx_content_sync_entity_id" ON "content_sync"("entity_id");

-- CreateIndex
CREATE INDEX "idx_content_sync_sync_status" ON "content_sync"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "content_sync_entity_type_entity_id_key" ON "content_sync"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_rate_limit_key" ON "rate_limits"("key");

-- CreateIndex
CREATE INDEX "idx_rate_limit_created_at" ON "rate_limits"("created_at");

-- CreateIndex
CREATE INDEX "idx_session_blacklist_session_id" ON "session_blacklist"("session_id");

-- CreateIndex
CREATE INDEX "idx_session_blacklist_user_id" ON "session_blacklist"("user_id");

-- CreateIndex
CREATE INDEX "idx_session_blacklist_expires_at" ON "session_blacklist"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_transaction_number_key" ON "financial_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_type" ON "financial_transactions"("type");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_date" ON "financial_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_status" ON "financial_transactions"("status");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_created_by" ON "financial_transactions"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "expense_details_transaction_id_key" ON "expense_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_details_transaction_id_key" ON "income_details"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_financial_reports_type" ON "financial_reports"("report_type");

-- CreateIndex
CREATE INDEX "idx_financial_reports_period_start" ON "financial_reports"("period_start");

-- CreateIndex
CREATE INDEX "idx_financial_reports_generated_by" ON "financial_reports"("generated_by");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "split_payments" ADD CONSTRAINT "split_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_additions" ADD CONSTRAINT "stock_additions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_additions" ADD CONSTRAINT "stock_additions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_additions" ADD CONSTRAINT "stock_additions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "stock_reconciliations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "fk_stock_adjustments_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "fk_stock_adjustments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "fk_stock_adjustments_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_content" ADD CONSTRAINT "ai_content_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_content" ADD CONSTRAINT "ai_content_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_sync" ADD CONSTRAINT "fk_content_sync_brand" FOREIGN KEY ("entity_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_sync" ADD CONSTRAINT "fk_content_sync_category" FOREIGN KEY ("entity_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_sync" ADD CONSTRAINT "fk_content_sync_product" FOREIGN KEY ("entity_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_details" ADD CONSTRAINT "expense_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

