#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVariantData() {
  try {
    console.log('🔍 Checking ProductVariant data...\n');

    // Check variant count
    const variantCount = await prisma.productVariant.count();
    console.log(`📊 ProductVariant records: ${variantCount}`);

    // Check products with hasVariants flag
    const productsWithVariants = await prisma.product.count({
      where: { hasVariants: true }
    });
    console.log(`📦 Products with hasVariants=true: ${productsWithVariants}`);

    // Check if any variants exist
    if (variantCount > 0) {
      console.log('\n⚠️  WARNING: ProductVariant table has data!');
      console.log('You should backup this data before proceeding with removal.\n');

      // Show sample variants
      const sampleVariants = await prisma.productVariant.findMany({
        take: 5,
        include: {
          products: {
            select: { name: true, sku: true }
          }
        }
      });

      console.log('Sample variants:');
      sampleVariants.forEach((v, i) => {
        console.log(`${i + 1}. ${v.name} (SKU: ${v.sku}) - Product: ${v.products?.name}`);
      });
    } else {
      console.log('\n✅ ProductVariant table is empty - safe to remove');
    }

    // Check sales items with variant_id
    const salesWithVariants = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sales_items WHERE variant_id IS NOT NULL
    `;
    console.log(`\n🛒 Sales items with variant_id: ${salesWithVariants[0].count}`);

    // Check stock adjustments with variant_id
    const adjustmentsWithVariants = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM stock_adjustments WHERE variant_id IS NOT NULL
    `;
    console.log(`📝 Stock adjustments with variant_id: ${adjustmentsWithVariants[0].count}`);

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error checking variant data:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkVariantData();
