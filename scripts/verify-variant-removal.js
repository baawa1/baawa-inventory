#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyVariantRemoval() {
  try {
    console.log('🔍 Verifying ProductVariant removal...\n');

    // Check if product_variants table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_variants'
      ) as exists;
    `;

    console.log(`📊 product_variants table exists: ${tableExists[0].exists}`);

    // Check if has_variants column exists
    const hasVariantsColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'has_variants'
      ) as exists;
    `;

    console.log(`📊 has_variants column exists: ${hasVariantsColumnExists[0].exists}`);

    // Check if variant_id columns exist
    const salesVariantIdExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'sales_items'
        AND column_name = 'variant_id'
      ) as exists;
    `;

    console.log(`📊 sales_items.variant_id column exists: ${salesVariantIdExists[0].exists}`);

    const adjustmentsVariantIdExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stock_adjustments'
        AND column_name = 'variant_id'
      ) as exists;
    `;

    console.log(`📊 stock_adjustments.variant_id column exists: ${adjustmentsVariantIdExists[0].exists}`);

    // Verify product_id is NOT NULL
    const salesProductIdNotNull = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'sales_items'
      AND column_name = 'product_id';
    `;

    console.log(`📊 sales_items.product_id is NOT NULL: ${salesProductIdNotNull[0].is_nullable === 'NO'}`);

    const adjustmentsProductIdNotNull = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'stock_adjustments'
      AND column_name = 'product_id';
    `;

    console.log(`📊 stock_adjustments.product_id is NOT NULL: ${adjustmentsProductIdNotNull[0].is_nullable === 'NO'}`);

    console.log('\n✅ Verification complete!');

    if (!tableExists[0].exists &&
        !hasVariantsColumnExists[0].exists &&
        !salesVariantIdExists[0].exists &&
        !adjustmentsVariantIdExists[0].exists &&
        salesProductIdNotNull[0].is_nullable === 'NO' &&
        adjustmentsProductIdNotNull[0].is_nullable === 'NO') {
      console.log('🎉 All ProductVariant references successfully removed!');
    } else {
      console.log('⚠️ Some references still exist - migration may be incomplete');
    }

  } catch (error) {
    console.error('❌ Error verifying removal:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyVariantRemoval();
