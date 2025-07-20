/*
  Warnings:

  - You are about to drop the `webflow_sync` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "webflow_sync" DROP CONSTRAINT "webflow_sync_product_id_fkey";

-- DropTable
DROP TABLE "webflow_sync";

-- CreateTable
CREATE TABLE "ContentSync" (
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

    CONSTRAINT "ContentSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_content_sync_entity_type" ON "ContentSync"("entity_type");

-- CreateIndex
CREATE INDEX "idx_content_sync_entity_id" ON "ContentSync"("entity_id");

-- CreateIndex
CREATE INDEX "idx_content_sync_sync_status" ON "ContentSync"("sync_status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSync_entity_type_entity_id_key" ON "ContentSync"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "ContentSync" ADD CONSTRAINT "fk_content_sync_product" FOREIGN KEY ("entity_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ContentSync" ADD CONSTRAINT "fk_content_sync_category" FOREIGN KEY ("entity_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ContentSync" ADD CONSTRAINT "fk_content_sync_brand" FOREIGN KEY ("entity_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
