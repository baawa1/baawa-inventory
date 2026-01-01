/**
 * Apply Price Constraints to Production Database
 * Adds CHECK constraints to ensure prices and costs are non-negative
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load production environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

async function applyPriceConstraintsProduction() {
  // Try DIRECT_URL first, fallback to DATABASE_URL (pooler)
  // Note: Supabase may block direct connections on port 5432, so pooler might be needed
  const productionUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!productionUrl) {
    console.error('❌ Error: No database URL provided');
    console.error('Usage: Set DATABASE_URL or DIRECT_URL in .env.production');
    process.exit(1);
  }

  console.log('🔗 Connecting to production database...');
  console.log(`📍 Using: ${productionUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: productionUrl,
      },
    },
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

    // Check error code in meta (Prisma wraps PostgreSQL codes)
    const pgCode = error.meta?.code || error.code;

    if (pgCode === '42710') {
      console.log('\n✅ Constraint already exists - production database is already protected!');
      console.log('   No action needed - constraints are in place.\n');
    } else if (pgCode === '23514' || pgCode === '23502') {
      console.error('\n❌ Found products with negative values - please fix them first.');
      process.exit(1);
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
