/**
 * Check Production Database Schema
 * Verifies that Sprint 1 migrations have been applied
 */

const { PrismaClient } = require('@prisma/client');

async function checkProductionSchema() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking production database schema...\n');

    // Check 1: Verify ProductVariant table is removed
    try {
      await prisma.$queryRaw`SELECT * FROM product_variants LIMIT 1`;
      console.log('❌ ISSUE: product_variants table still exists (should be removed)');
    } catch (error) {
      if (error.code === '42P01') {
        console.log('✅ ProductVariant table removed successfully');
      } else {
        console.log('⚠️  Error checking product_variants:', error.message);
      }
    }

    // Check 2: Verify stock constraints exist
    try {
      const constraints = await prisma.$queryRaw`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_schema = 'public'
        AND constraint_name LIKE '%stock%'
      `;
      console.log('\n✅ Stock constraints:', constraints);
    } catch (error) {
      console.log('❌ Error checking stock constraints:', error.message);
    }

    // Check 3: Verify SalesItem.product_id is NOT NULL
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'sales_items'
        AND column_name = 'product_id'
      `;
      console.log('\n✅ SalesItem.product_id column:', columns);
      if (columns[0]?.is_nullable === 'NO') {
        console.log('✅ product_id is NOT NULL (correct)');
      } else {
        console.log('❌ product_id is nullable (should be NOT NULL)');
      }
    } catch (error) {
      console.log('❌ Error checking product_id column:', error.message);
    }

    // Check 4: Test a simple query
    try {
      const productCount = await prisma.product.count();
      console.log(`\n✅ Product count: ${productCount}`);
    } catch (error) {
      console.log('❌ Error counting products:', error.message);
    }

    // Check 5: Test SalesItem query
    try {
      const salesItems = await prisma.salesItem.findMany({
        take: 1,
        select: {
          id: true,
          product_id: true,
          products: {
            select: {
              name: true,
            },
          },
        },
      });
      console.log('\n✅ SalesItem query successful:', salesItems);
    } catch (error) {
      console.log('❌ Error querying sales items:', error.message);
      console.log('   Full error:', error);
    }

    // Check 6: Test dashboard query
    try {
      const recentTransactions = await prisma.salesTransaction.findMany({
        take: 1,
        include: {
          sales_items: {
            select: {
              quantity: true,
              products: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      console.log('\n✅ Dashboard query successful');
    } catch (error) {
      console.log('❌ Dashboard query failed:', error.message);
      console.log('   Full error:', error);
    }

    console.log('\n✅ Schema check complete');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionSchema()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
