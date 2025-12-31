-- Remove WordPress integration fields
-- Sprint 1.4: Remove WordPress integration fields

-- Drop wordpress_id from brands
ALTER TABLE "brands" DROP COLUMN IF EXISTS "wordpress_id";

-- Drop wordpress_id from categories
ALTER TABLE "categories" DROP COLUMN IF EXISTS "wordpress_id";

-- Drop wordpress_id from products
ALTER TABLE "products" DROP COLUMN IF EXISTS "wordpress_id";

-- Drop sync_stats from products
ALTER TABLE "products" DROP COLUMN IF EXISTS "sync_stats";

-- Drop wordpress_id from coupons
ALTER TABLE "coupons" DROP COLUMN IF EXISTS "wordpress_id";

-- Drop wordpress_id from customers
ALTER TABLE "customers" DROP COLUMN IF EXISTS "wordpress_id";

-- Drop wordpress_id from suppliers
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "wordpress_id";
