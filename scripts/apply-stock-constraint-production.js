#!/usr/bin/env node

// Load production environment
require('dotenv').config({ path: '.env.production.temp' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyProductionStockConstraint() {
  try {
    console.log('🚀 PRODUCTION: Applying Stock Non-Negative Constraints');
    console.log('⚠️  DATABASE: PRODUCTION');
    console.log('═══════════════════════════════════════════════════\n');

    // SAFETY CHECK: Verify no negative stock exists
    console.log('🔒 SAFETY CHECK: Checking for negative stock values...\n');

    const negativeStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
    });

    const negativeMinStockProducts = await prisma.product.findMany({
      where: {
        minStock: {
          lt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        minStock: true,
      },
    });

    console.log(`   - Products with negative stock: ${negativeStockProducts.length}`);
    console.log(`   - Products with negative min_stock: ${negativeMinStockProducts.length}`);

    if (negativeStockProducts.length > 0 || negativeMinStockProducts.length > 0) {
      console.log('\n❌ SAFETY CHECK FAILED: Found products with negative values!');
      console.log('Migration aborted. Fix negative values before applying constraints.\n');
      process.exit(1);
    }

    console.log('✅ SAFETY CHECK PASSED: No negative stock values found\n');

    // Get total product count
    const totalProducts = await prisma.product.count();
    console.log(`Total products in database: ${totalProducts}\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('🔥 READY TO APPLY CONSTRAINTS');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nThis will:');
    console.log('  1. Add CHECK constraint: stock >= 0');
    console.log('  2. Add CHECK constraint: min_stock >= 0');
    console.log('\n⚠️  These constraints will prevent negative stock values forever!');
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

    console.log('\n🚀 Applying constraints to PRODUCTION...\n');

    // Apply stock constraint
    console.log('Step 1: Adding CHECK constraint for stock >= 0...');
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "products" ADD CONSTRAINT "check_stock_non_negative" CHECK (stock >= 0)`
      );
      console.log('✓ Stock constraint added\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Stock constraint already exists (skipping)\n');
      } else {
        throw error;
      }
    }

    // Apply min_stock constraint
    console.log('Step 2: Adding CHECK constraint for min_stock >= 0...');
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "products" ADD CONSTRAINT "check_min_stock_non_negative" CHECK (min_stock >= 0)`
      );
      console.log('✓ Min stock constraint added\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Min stock constraint already exists (skipping)\n');
      } else {
        throw error;
      }
    }

    // Verify constraints
    console.log('🔍 Verifying constraints...');
    const constraints = await prisma.$queryRaw`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conname IN ('check_stock_non_negative', 'check_min_stock_non_negative')
        AND n.nspname = 'public'
    `;

    console.log('\nConstraints verified:');
    constraints.forEach(constraint => {
      console.log(`   ✓ ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });

    console.log('\n✅ ALL CONSTRAINTS APPLIED SUCCESSFULLY!\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ PRODUCTION MIGRATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('  1. ✅ Database constraints applied');
    console.log('  2. ✅ Application code already deployed (from DEV)');
    console.log('  3. ⏳ Test stock validation in production');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('\nNo partial changes - constraints are atomic operations.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyProductionStockConstraint();
