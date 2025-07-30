-- CreateTable
CREATE TABLE "split_payments" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT now(),

    CONSTRAINT "split_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_split_payments_transaction_id" ON "split_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_split_payments_payment_method" ON "split_payments"("payment_method");

-- AddForeignKey
ALTER TABLE "split_payments" ADD CONSTRAINT "split_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION; 