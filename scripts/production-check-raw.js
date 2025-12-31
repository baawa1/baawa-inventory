#!/usr/bin/env node

// Load production environment
require('dotenv').config({ path: '.env.production.temp' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductionRaw() {
  try {
    console.log('🔍 Checking PRODUCTION database tables...');
    console.log('⚠️  DATABASE: PRODUCTION (READ-ONLY)\n');

    // Check if product_variants table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_variants'
      ) as exists;
    `;

    console.log(`📊 product_variants table exists: ${tableExists[0].exists}`);

    if (tableExists[0].exists) {
      // Count variants
      const variantCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM product_variants
      `;
      console.log(`📦 ProductVariant records: ${variantCount[0].count}`);

      // Count products with hasVariants
      const productsWithVariants = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM products WHERE has_variants = true
      `;
      console.log(`📦 Products with hasVariants=true: ${productsWithVariants[0].count}`);

      // Count sales with variants
      const salesWithVariants = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM sales_items WHERE variant_id IS NOT NULL
      `;
      console.log(`🛒 Sales items with variant_id: ${salesWithVariants[0].count}`);

      // Count adjustments with variants
      const adjustmentsWithVariants = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM stock_adjustments WHERE variant_id IS NOT NULL
      `;
      console.log(`📝 Stock adjustments with variant_id: ${adjustmentsWithVariants[0].count}`);

      console.log('\n⚠️  PRODUCTION HAS VARIANT DATA - Migration needed!');
    } else {
      console.log('\n✅ ProductVariant table already removed from production!');
    }

    // Check if has_variants column exists
    const hasVariantsExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'has_variants'
      ) as exists;
    `;
    console.log(`\n📊 has_variants column exists: ${hasVariantsExists[0].exists}`);

    // Check if variant_id columns exist
    const salesVariantIdExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'sales_items'
        AND column_name = 'variant_id'
      ) as exists;
    `;
    console.log(`📊 sales_items.variant_id exists: ${salesVariantIdExists[0].exists}`);

    const adjustmentsVariantIdExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stock_adjustments'
        AND column_name = 'variant_id'
      ) as exists;
    `;
    console.log(`📊 stock_adjustments.variant_id exists: ${adjustmentsVariantIdExists[0].exists}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionRaw();
