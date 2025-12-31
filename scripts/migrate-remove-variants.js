#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateRemoveVariants() {
  try {
    console.log('🚀 Starting ProductVariant removal migration...\n');
    console.log('⚠️  This will:');
    console.log('   1. Consolidate variant stock into parent products');
    console.log('   2. Update sales_items references (variant_id → product_id)');
    console.log('   3. Update stock_adjustments references');
    console.log('   4. Remove hasVariants flag from products');
    console.log('   5. Prepare for ProductVariant table removal\n');

    // Step 1: Consolidate variant stock into parent products
    console.log('📦 Step 1: Consolidating variant stock into parent products...');

    const productsWithVariants = await prisma.product.findMany({
      where: { hasVariants: true },
      include: {
        product_variants: {
          select: { id: true, current_stock: true, name: true }
        }
      }
    });

    console.log(`   Found ${productsWithVariants.length} products with variants`);

    for (const product of productsWithVariants) {
      const totalVariantStock = product.product_variants.reduce(
        (sum, variant) => sum + variant.current_stock,
        0
      );

      console.log(`   - ${product.name}: Adding ${totalVariantStock} from ${product.product_variants.length} variants`);

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock + totalVariantStock,
          hasVariants: false  // Remove the flag
        }
      });
    }

    console.log('✅ Stock consolidated\n');

    // Step 2: Update sales_items with variant_id
    console.log('🛒 Step 2: Updating sales_items references...');

    const salesWithVariants = await prisma.salesItem.findMany({
      where: { variant_id: { not: null } },
      include: {
        product_variants: {
          select: { product_id: true }
        }
      }
    });

    console.log(`   Found ${salesWithVariants.length} sales items with variant references`);

    for (const saleItem of salesWithVariants) {
      if (saleItem.product_variants?.product_id) {
        await prisma.salesItem.update({
          where: { id: saleItem.id },
          data: {
            product_id: saleItem.product_variants.product_id,
            variant_id: null  // Clear variant reference
          }
        });
      }
    }

    console.log('✅ Sales items updated\n');

    // Step 3: Update stock_adjustments with variant_id
    console.log('📝 Step 3: Updating stock_adjustments references...');

    const adjustmentsWithVariants = await prisma.stockAdjustment.findMany({
      where: { variant_id: { not: null } },
      include: {
        product_variants: {
          select: { product_id: true }
        }
      }
    });

    console.log(`   Found ${adjustmentsWithVariants.length} stock adjustments with variant references`);

    for (const adjustment of adjustmentsWithVariants) {
      if (adjustment.product_variants?.product_id) {
        await prisma.stockAdjustment.update({
          where: { id: adjustment.id },
          data: {
            product_id: adjustment.product_variants.product_id,
            variant_id: null  // Clear variant reference
          }
        });
      }
    }

    console.log('✅ Stock adjustments updated\n');

    // Step 4: Verification
    console.log('🔍 Step 4: Verifying migration...');

    const remainingSalesWithVariants = await prisma.salesItem.count({
      where: { variant_id: { not: null } }
    });

    const remainingAdjustmentsWithVariants = await prisma.stockAdjustment.count({
      where: { variant_id: { not: null } }
    });

    const remainingProductsWithVariants = await prisma.product.count({
      where: { hasVariants: true }
    });

    console.log(`   - Sales items with variant_id: ${remainingSalesWithVariants} (should be 0)`);
    console.log(`   - Stock adjustments with variant_id: ${remainingAdjustmentsWithVariants} (should be 0)`);
    console.log(`   - Products with hasVariants=true: ${remainingProductsWithVariants} (should be 0)`);

    if (remainingSalesWithVariants === 0 &&
        remainingAdjustmentsWithVariants === 0 &&
        remainingProductsWithVariants === 0) {
      console.log('\n✅ Migration successful! All references migrated.');
      console.log('\n📋 Next steps:');
      console.log('   1. Run the Prisma migration to remove ProductVariant table');
      console.log('   2. Update your codebase to remove variant references');
      console.log('   3. Test thoroughly before deploying to production');
    } else {
      console.log('\n⚠️  Warning: Some references were not migrated. Please review.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRemoveVariants();
