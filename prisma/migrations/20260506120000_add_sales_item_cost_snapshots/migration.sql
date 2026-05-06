ALTER TABLE "sales_items"
ADD COLUMN "unit_cost" DECIMAL(10, 2),
ADD COLUMN "total_cost" DECIMAL(10, 2),
ADD COLUMN "cost_is_estimated" BOOLEAN NOT NULL DEFAULT false;

UPDATE "sales_items" AS sale_item
SET
    "unit_cost" = product."cost",
    "total_cost" = ROUND((product."cost" * sale_item."quantity")::numeric, 2),
    "cost_is_estimated" = true
FROM "products" AS product
WHERE sale_item."product_id" = product."id"
  AND product."is_service" = false
  AND sale_item."unit_cost" IS NULL
  AND sale_item."total_cost" IS NULL;
