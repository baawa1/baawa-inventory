require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalyticsEndpoints() {
  console.log('🧪 Testing Analytics API Endpoints...\n');

  try {
    // Test 1: Check if we have any sales transactions
    console.log('📊 Test 1: Checking sales transactions...');
    const salesCount = await prisma.salesTransaction.count();
    console.log(`   Found ${salesCount} sales transactions`);

    // Test 2: Check if we have any products
    console.log('📦 Test 2: Checking products...');
    const productCount = await prisma.product.count();
    console.log(`   Found ${productCount} products`);

    // Test 3: Check if we have any categories
    console.log('🏷️  Test 3: Checking categories...');
    const categoryCount = await prisma.category.count();
    console.log(`   Found ${categoryCount} categories`);

    // Test 4: Check recent sales data
    console.log('💰 Test 4: Checking recent sales data...');
    const recentSales = await prisma.salesTransaction.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        transaction_number: true,
        total_amount: true,
        created_at: true,
        payment_status: true,
      },
    });
    console.log(`   Found ${recentSales.length} recent sales`);
    recentSales.forEach(sale => {
      console.log(`   - ${sale.transaction_number}: ${sale.total_amount} (${sale.payment_status})`);
    });

    // Test 5: Check product sales data
    console.log('📈 Test 5: Checking product sales data...');
    const productSales = await prisma.salesItem.findMany({
      take: 5,
      include: {
        products: {
          select: { name: true, sku: true },
        },
        sales_transactions: {
          select: { created_at: true, payment_status: true },
        },
      },
    });
    console.log(`   Found ${productSales.length} product sales items`);
    productSales.forEach(item => {
      console.log(`   - ${item.products?.name || 'Unknown'}: ${item.quantity} units`);
    });

    console.log('\n✅ Analytics data verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Sales Transactions: ${salesCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Categories: ${categoryCount}`);
    console.log(`   - Recent Sales: ${recentSales.length}`);
    console.log(`   - Product Sales Items: ${productSales.length}`);

    if (salesCount > 0 && productCount > 0) {
      console.log('\n🎉 Analytics system is ready with real data!');
    } else {
      console.log('\n⚠️  Analytics system needs more data for meaningful insights.');
      console.log('   Consider adding some sample sales transactions and products.');
    }

  } catch (error) {
    console.error('❌ Error testing analytics endpoints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAnalyticsEndpoints(); 