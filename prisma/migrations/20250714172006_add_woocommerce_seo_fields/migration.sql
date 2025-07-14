-- AlterTable
ALTER TABLE "products" ADD COLUMN     "allow_backorders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allow_reviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gtin" VARCHAR(100),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meta_content" TEXT,
ADD COLUMN     "meta_excerpt" TEXT,
ADD COLUMN     "primary_category" VARCHAR(255),
ADD COLUMN     "sale_end_date" TIMESTAMPTZ(6),
ADD COLUMN     "sale_price" DECIMAL(10,2),
ADD COLUMN     "sale_start_date" TIMESTAMPTZ(6),
ADD COLUMN     "seo_score" INTEGER,
ADD COLUMN     "shipping_class" VARCHAR(100),
ADD COLUMN     "sold_individually" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sort_order" INTEGER,
ADD COLUMN     "variant_attributes" JSONB,
ADD COLUMN     "variant_values" JSONB;

-- CreateIndex
CREATE INDEX "idx_products_is_featured" ON "products"("is_featured");

-- CreateIndex
CREATE INDEX "idx_products_sort_order" ON "products"("sort_order");
