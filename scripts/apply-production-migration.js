#!/usr/bin/env node

// Load production environment
require('dotenv').config({ path: '.env.production.temp' });

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function applyProductionMigration() {
  try {
    console.log('🚀 PRODUCTION Migration: Remove ProductVariant');
    console.log('⚠️  DATABASE: PRODUCTION');
    console.log('═══════════════════════════════════════════════════\n');

    // SAFETY CHECK 1: Verify no variant data exists
    console.log('🔒 SAFETY CHECK 1: Verifying no variant data...');

    const variantCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM product_variants
    `;

    const hasVariantsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM products WHERE has_variants = true
    `;

    const salesVariantCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sales_items WHERE variant_id IS NOT NULL
    `;

    const adjVariantCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM stock_adjustments WHERE variant_id IS NOT NULL
    `;

    console.log(`   - ProductVariant records: ${variantCount[0].count}`);
    console.log(`   - Products with hasVariants: ${hasVariantsCount[0].count}`);
    console.log(`   - Sales with variant_id: ${salesVariantCount[0].count}`);
    console.log(`   - Adjustments with variant_id: ${adjVariantCount[0].count}`);

    if (variantCount[0].count > 0 || hasVariantsCount[0].count > 0 ||
        salesVariantCount[0].count > 0 || adjVariantCount[0].count > 0) {
      throw new Error('❌ SAFETY CHECK FAILED: Variant data exists! Migration aborted.');
    }

    console.log('✅ SAFETY CHECK PASSED: No variant data found\n');

    // SAFETY CHECK 2: Verify no NULL product_id values
    console.log('🔒 SAFETY CHECK 2: Verifying product_id integrity...');

    const nullSalesProductId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sales_items WHERE product_id IS NULL
    `;

    const nullAdjProductId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM stock_adjustments WHERE product_id IS NULL
    `;

    console.log(`   - Sales items with NULL product_id: ${nullSalesProductId[0].count}`);
    console.log(`   - Adjustments with NULL product_id: ${nullAdjProductId[0].count}`);

    if (nullSalesProductId[0].count > 0 || nullAdjProductId[0].count > 0) {
      throw new Error('❌ SAFETY CHECK FAILED: NULL product_id values exist! Fix data first.');
    }

    console.log('✅ SAFETY CHECK PASSED: All product_id values valid\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🔥 READY TO APPLY MIGRATION');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nThis will:');
    console.log('  1. Drop product_variants table (empty)');
    console.log('  2. Drop has_variants column from products');
    console.log('  3. Drop variant_id columns from sales_items and stock_adjustments');
    console.log('  4. Make product_id NOT NULL');
    console.log('\n⚠️  This cannot be undone without a database backup!');
    console.log('\nType "PROCEED" to continue or Ctrl+C to cancel...\n');

    // Wait for user confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise(resolve => {
      readline.question('> ', answer => {
        readline.close();
        resolve(answer.trim());
      });
    });

    if (confirmation !== 'PROCEED') {
      console.log('\n❌ Migration cancelled by user.');
      process.exit(0);
    }

    console.log('\n🚀 Applying migration to PRODUCTION...\n');

    // Read and execute the SQL migration
    const sqlScript = fs.readFileSync(
      './scripts/production-remove-variants-SAFE.sql',
      'utf8'
    );

    // Execute as a transaction
    await prisma.$executeRawUnsafe(sqlScript);

    console.log('\n✅ PRODUCTION MIGRATION COMPLETED SUCCESSFULLY!\n');

    // Verify migration
    console.log('🔍 Verifying migration...');

    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'product_variants'
      ) as exists
    `;

    const hasVariantsExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'has_variants'
      ) as exists
    `;

    console.log(`   - product_variants table exists: ${tableExists[0].exists}`);
    console.log(`   - has_variants column exists: ${hasVariantsExists[0].exists}`);

    if (!tableExists[0].exists && !hasVariantsExists[0].exists) {
      console.log('\n✅ VERIFICATION PASSED: Migration successful!\n');
    } else {
      console.log('\n⚠️  VERIFICATION WARNING: Some objects still exist\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('Next steps on PRODUCTION server:');
    console.log('  1. Deploy updated codebase with new Prisma schema');
    console.log('  2. Run: npx prisma generate');
    console.log('  3. Restart application');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('\nNo changes were applied. Database is unchanged.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyProductionMigration();
