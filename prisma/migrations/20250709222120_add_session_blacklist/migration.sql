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

-- CreateIndex
CREATE INDEX "idx_session_blacklist_session_id" ON "session_blacklist"("session_id");

-- CreateIndex
CREATE INDEX "idx_session_blacklist_user_id" ON "session_blacklist"("user_id");

-- CreateIndex
CREATE INDEX "idx_session_blacklist_expires_at" ON "session_blacklist"("expires_at");
