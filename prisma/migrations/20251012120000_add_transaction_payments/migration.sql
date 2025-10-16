-- Create transaction_payments table for tracking debt settlements and deposits
CREATE TABLE "transaction_payments" (
    "id" SERIAL PRIMARY KEY,
    "transaction_id" INTEGER NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "payment_date" TIMESTAMPTZ(6),
    "recorded_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Foreign key constraints
ALTER TABLE "transaction_payments"
    ADD CONSTRAINT "transaction_payments_transaction_id_fkey"
    FOREIGN KEY ("transaction_id")
    REFERENCES "sales_transactions"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;

ALTER TABLE "transaction_payments"
    ADD CONSTRAINT "transaction_payments_recorded_by_fkey"
    FOREIGN KEY ("recorded_by")
    REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;

-- Helpful indexes for queries
CREATE INDEX "idx_transaction_payments_transaction_id"
    ON "transaction_payments" ("transaction_id");

CREATE INDEX "idx_transaction_payments_payment_method"
    ON "transaction_payments" ("payment_method");

CREATE INDEX "idx_transaction_payments_recorded_by"
    ON "transaction_payments" ("recorded_by");
