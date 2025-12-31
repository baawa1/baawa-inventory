#!/usr/bin/env node

// Load production environment
require('dotenv').config({ path: '.env.production.temp' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyProductionMigration() {
  try {
    console.log('🚀 PRODUCTION Migration: Remove ProductVariant');
    console.log('⚠️  DATABASE: PRODUCTION');
    console.log('═══════════════════════════════════════════════════\n');

    // SAFETY CHECK 1: Verify no variant data exists
    console.log('🔒 SAFETY CHECK 1: Verifying no variant data...');

    const variantCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM product_variants`;
    const hasVariantsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products WHERE has_variants = true`;
    const salesVariantCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sales_items WHERE variant_id IS NOT NULL`;
    const adjVariantCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM stock_adjustments WHERE variant_id IS NOT NULL`;

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

    const nullSalesProductId = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sales_items WHERE product_id IS NULL`;
    const nullAdjProductId = await prisma.$queryRaw`SELECT COUNT(*) as count FROM stock_adjustments WHERE product_id IS NULL`;

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
    console.log('\n⚠️  This cannot be undone without restoring from backup!');
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

    // Execute migration commands one by one
    console.log('Step 1: Dropping foreign key constraints...');
    await prisma.$executeRawUnsafe(`ALTER TABLE sales_items DROP CONSTRAINT IF EXISTS sales_items_variant_id_fkey`);
    await prisma.$executeRawUnsafe(`ALTER TABLE stock_adjustments DROP CONSTRAINT IF EXISTS fk_stock_adjustments_variant_id`);
    await prisma.$executeRawUnsafe(`ALTER TABLE stock_adjustments DROP CONSTRAINT IF EXISTS stock_adjustments_variant_id_fkey`);
    console.log('✓ Foreign key constraints dropped');

    console.log('\nStep 2: Dropping indexes...');
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_sales_items_variant_id`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_stock_adjustments_variant_id`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_product_variants_product_id`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_product_variants_sku`);
    console.log('✓ Indexes dropped');

    console.log('\nStep 3: Dropping variant_id columns...');
    await prisma.$executeRawUnsafe(`ALTER TABLE sales_items DROP COLUMN IF EXISTS variant_id`);
    await prisma.$executeRawUnsafe(`ALTER TABLE stock_adjustments DROP COLUMN IF EXISTS variant_id`);
    console.log('✓ variant_id columns dropped');

    console.log('\nStep 4: Making product_id NOT NULL...');
    await prisma.$executeRawUnsafe(`ALTER TABLE sales_items ALTER COLUMN product_id SET NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE stock_adjustments ALTER COLUMN product_id SET NOT NULL`);
    console.log('✓ product_id columns set to NOT NULL');

    console.log('\nStep 5: Dropping has_variants column...');
    await prisma.$executeRawUnsafe(`ALTER TABLE products DROP COLUMN IF EXISTS has_variants`);
    console.log('✓ has_variants column dropped');

    console.log('\nStep 6: Dropping product_variants table...');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS product_variants CASCADE`);
    console.log('✓ product_variants table dropped');

    console.log('\n✅ ALL MIGRATION STEPS COMPLETED SUCCESSFULLY!\n');

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

    const variantIdSalesExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'sales_items' AND column_name = 'variant_id'
      ) as exists
    `;

    console.log(`   ✓ product_variants table removed: ${!tableExists[0].exists}`);
    console.log(`   ✓ has_variants column removed: ${!hasVariantsExists[0].exists}`);
    console.log(`   ✓ variant_id column removed: ${!variantIdSalesExists[0].exists}`);

    if (!tableExists[0].exists && !hasVariantsExists[0].exists && !variantIdSalesExists[0].exists) {
      console.log('\n✅ VERIFICATION PASSED: Migration successful!\n');
    } else {
      console.log('\n⚠️  VERIFICATION WARNING: Some objects still exist\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ PRODUCTION MIGRATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('  1. ✅ Database migration complete');
    console.log('  2. ⏳ Deploy updated codebase (Prisma schema already updated)');
    console.log('  3. ⏳ On production server, run: npx prisma generate');
    console.log('  4. ⏳ Restart application');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('\nIf migration was partially applied, you may need to restore from backup.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyProductionMigration();
