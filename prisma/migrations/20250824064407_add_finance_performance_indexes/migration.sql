-- CreateIndex
CREATE INDEX "idx_financial_transactions_type_date" ON "financial_transactions"("type", "transaction_date");

-- CreateIndex
CREATE INDEX "idx_financial_transactions_status_date" ON "financial_transactions"("status", "transaction_date");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_payment_status_created_at" ON "sales_transactions"("payment_status", "created_at");

-- CreateIndex
CREATE INDEX "idx_stock_additions_purchase_date_total_cost" ON "stock_additions"("purchase_date", "total_cost");
