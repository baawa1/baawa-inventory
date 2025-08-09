-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_service" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sales_transactions" ADD COLUMN     "customer_id" INTEGER;

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "billing_address" TEXT,
    "shipping_address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) DEFAULT 'Nigeria',
    "customer_type" VARCHAR(50) DEFAULT 'individual',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_fees" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "fee_type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "idx_customers_phone" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "idx_customers_state" ON "customers"("state");

-- CreateIndex
CREATE INDEX "idx_customers_city" ON "customers"("city");

-- CreateIndex
CREATE INDEX "idx_customers_customer_type" ON "customers"("customer_type");

-- CreateIndex
CREATE INDEX "idx_customers_is_active" ON "customers"("is_active");

-- CreateIndex
CREATE INDEX "idx_transaction_fees_transaction_id" ON "transaction_fees"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_transaction_fees_fee_type" ON "transaction_fees"("fee_type");

-- CreateIndex
CREATE INDEX "idx_products_is_service" ON "products"("is_service");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_customer_id" ON "sales_transactions"("customer_id");

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_fees" ADD CONSTRAINT "transaction_fees_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
