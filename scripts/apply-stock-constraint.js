#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyStockConstraint() {
  try {
    console.log('🚀 Applying stock non-negative constraints...\n');

    // Add CHECK constraint for stock
    console.log('Adding CHECK constraint for stock >= 0...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "products" ADD CONSTRAINT "check_stock_non_negative" CHECK (stock >= 0)`
    );
    console.log('✅ Stock constraint added\n');

    // Add CHECK constraint for min_stock
    console.log('Adding CHECK constraint for min_stock >= 0...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "products" ADD CONSTRAINT "check_min_stock_non_negative" CHECK (min_stock >= 0)`
    );
    console.log('✅ Min stock constraint added\n');

    // Verify constraints were created
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

    console.log('\nConstraints created:');
    constraints.forEach(constraint => {
      console.log(`   ✓ ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });

    console.log('\n✅ Stock non-negative constraints applied successfully!\n');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Constraints already exist, skipping.\n');
    } else {
      console.error('❌ Error applying constraints:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyStockConstraint();
