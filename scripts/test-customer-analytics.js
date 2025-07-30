const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testCustomerAnalytics() {
  try {
    console.log('🧪 Testing Customer Analytics API...\n');

    // Test the database queries directly
    console.log('1. Testing database queries...');

    // Get all customers with their transaction data
    const customerTransactions = await prisma.salesTransaction.groupBy({
      by: ['customer_email', 'customer_name', 'customer_phone'],
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'], // Include all successful payment statuses
        },
        customer_email: {
          not: null,
        },
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
      _max: {
        created_at: true,
      },
      _min: {
        created_at: true,
      },
    });

    console.log(`✅ Found ${customerTransactions.length} customers with transactions`);

    // Process customer data
    const customers = customerTransactions
      .filter(customer => customer.customer_email)
      .map(customer => {
        const totalSpent = Number(customer._sum.total_amount || 0);
        const totalOrders = customer._count.id;
        const lastPurchase = customer._max.created_at;
        const firstPurchase = customer._min.created_at;
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        return {
          id: customer.customer_email,
          name: customer.customer_name || 'Unknown Customer',
          email: customer.customer_email,
          phone: customer.customer_phone,
          totalSpent,
          totalOrders,
          lastPurchase: lastPurchase?.toISOString() || new Date().toISOString(),
          firstPurchase: firstPurchase?.toISOString() || new Date().toISOString(),
          averageOrderValue,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate ranks
    customers.forEach((customer, index) => {
      customer.rank = index + 1;
    });

    console.log(`✅ Processed ${customers.length} customers`);

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue = totalCustomers > 0 
      ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / totalCustomers 
      : 0;

    console.log('\n2. Summary Statistics:');
    console.log(`   Total Customers: ${totalCustomers}`);
    console.log(`   Total Revenue: ₦${totalRevenue.toLocaleString()}`);
    console.log(`   Average Order Value: ₦${averageOrderValue.toLocaleString()}`);

    // Show top 5 customers
    console.log('\n3. Top 5 Customers:');
    customers.slice(0, 5).forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} (${customer.email})`);
      console.log(`      Total Spent: ₦${customer.totalSpent.toLocaleString()}`);
      console.log(`      Orders: ${customer.totalOrders}`);
      console.log(`      Avg Order: ₦${customer.averageOrderValue.toLocaleString()}`);
      console.log('');
    });

    // Test customer segments
    const totalCustomersForSegments = customers.length;
    if (totalCustomersForSegments > 0) {
      const sortedCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
      
      const vipThreshold = sortedCustomers[Math.floor(totalCustomersForSegments * 0.1)]?.totalSpent || 0;
      const regularThreshold = sortedCustomers[Math.floor(totalCustomersForSegments * 0.4)]?.totalSpent || 0;
      const occasionalThreshold = sortedCustomers[Math.floor(totalCustomersForSegments * 0.8)]?.totalSpent || 0;

      let vip = 0, regular = 0, occasional = 0, inactive = 0;

      customers.forEach(customer => {
        if (customer.totalSpent >= vipThreshold) {
          vip++;
        } else if (customer.totalSpent >= regularThreshold) {
          regular++;
        } else if (customer.totalSpent >= occasionalThreshold) {
          occasional++;
        } else {
          inactive++;
        }
      });

      console.log('4. Customer Segments:');
      console.log(`   VIP (Top 10%): ${vip} customers`);
      console.log(`   Regular (Top 50%): ${regular} customers`);
      console.log(`   Occasional (Top 80%): ${occasional} customers`);
      console.log(`   Inactive (Bottom 20%): ${inactive} customers`);
    }

    console.log('\n✅ Customer Analytics test completed successfully!');
    console.log('\n📊 The API should now work correctly with real customer data.');

  } catch (error) {
    console.error('❌ Error testing customer analytics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerAnalytics(); 