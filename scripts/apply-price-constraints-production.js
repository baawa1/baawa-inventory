/**
 * Apply Price Constraints to Production Database
 * Adds CHECK constraints to ensure prices and costs are non-negative
 */

const { PrismaClient } = require('@prisma/client');

async function applyPriceConstraintsProduction() {
  // Use DIRECT_URL for production (from environment or pass as argument)
  const productionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!productionUrl) {
    console.error('❌ Error: No database URL provided');
    console.error('Usage: DIRECT_URL="your-production-url" node apply-price-constraints-production.js');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasourceUrl: productionUrl,
  });

  try {
    console.log('🔍 Checking PRODUCTION database for negative values...\n');

    // Check for negative prices
    const negativePrice = await prisma.product.count({
      where: { price: { lt: 0 } },
    });

    // Check for negative costs
    const negativeCost = await prisma.product.count({
      where: { cost: { lt: 0 } },
    });

    console.log(`Products with negative price: ${negativePrice}`);
    console.log(`Products with negative cost: ${negativeCost}\n`);

    if (negativePrice > 0 || negativeCost > 0) {
      console.log('⚠️  ERROR: Found products with negative values!');
      console.log('Cannot apply constraints until these are fixed.\n');
      process.exit(1);
    }

    console.log('✅ No negative values found - safe to proceed\n');
    console.log('📊 Applying price constraints to PRODUCTION database...\n');

    // Add price non-negative constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products
      ADD CONSTRAINT check_price_non_negative CHECK (price >= 0)
    `);
    console.log('✅ Added check_price_non_negative constraint');

    // Add cost non-negative constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products
      ADD CONSTRAINT check_cost_non_negative CHECK (cost >= 0)
    `);
    console.log('✅ Added check_cost_non_negative constraint\n');

    console.log('🎉 All constraints applied successfully to PRODUCTION!');
    console.log('\nBenefits:');
    console.log('  ✅ Prevents negative prices in future');
    console.log('  ✅ Prevents negative costs in future');
    console.log('  ✅ Data integrity protected');

  } catch (error) {
    console.error('❌ Error applying constraints:', error.message);

    if (error.code === '23514') {
      console.error('\nConstraint already exists - this is safe to ignore.');
    } else if (error.code === '23502') {
      console.error('\nFound products with negative values - please fix them first.');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyPriceConstraintsProduction()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
