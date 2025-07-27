/**
 * Script to check existing customer data in sales transactions
 * This will show you what customer information is currently in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCustomerData() {
  try {
    console.log('🔍 Checking existing customer data...\n');
    
    // Check total sales transactions
    const totalTransactions = await prisma.salesTransaction.count();
    console.log(`📊 Total sales transactions: ${totalTransactions}`);
    
    // Check transactions with customer data
    const transactionsWithCustomers = await prisma.salesTransaction.count({
      where: {
        OR: [
          { customer_email: { not: null } },
          { customer_name: { not: null } },
          { customer_phone: { not: null } },
        ],
      },
    });
    console.log(`👥 Transactions with customer data: ${transactionsWithCustomers}\n`);
    
    if (transactionsWithCustomers === 0) {
      console.log('❌ No customer data found in sales transactions!');
      console.log('   This is why the customer search shows "Customer information is unique"');
      console.log('   Run the add-test-customers.js script to create test data.\n');
      return;
    }
    
    // Get unique customers
    const customers = await prisma.salesTransaction.groupBy({
      by: ['customer_email', 'customer_name', 'customer_phone'],
      where: {
        OR: [
          { customer_email: { not: null } },
          { customer_name: { not: null } },
          { customer_phone: { not: null } },
        ],
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
    });
    
    console.log(`👤 Unique customers found: ${customers.length}\n`);
    
    // Display customer information
    console.log('📋 Customer Details:');
    customers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.customer_name || 'Unknown'}`);
      console.log(`      Email: ${customer.customer_email || 'N/A'}`);
      console.log(`      Phone: ${customer.customer_phone || 'N/A'}`);
      console.log(`      Orders: ${customer._count.id}`);
      console.log(`      Total Spent: ₦${Number(customer._sum.total_amount || 0).toLocaleString()}`);
      console.log('');
    });
    
    // Test specific search queries
    console.log('🧪 Testing specific search queries:');
    
    const testQueries = [
      'baawapay+joshua.thomas@gmail.com',
      '09062690013',
      'john.doe@example.com',
      '08012345678',
    ];
    
    for (const query of testQueries) {
      const results = await prisma.salesTransaction.groupBy({
        by: ['customer_email', 'customer_name', 'customer_phone'],
        where: {
          OR: [
            {
              customer_email: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              customer_name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              customer_phone: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
      
      console.log(`   "${query}": ${results.length} matches`);
    }
    
  } catch (error) {
    console.error('❌ Error checking customer data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkCustomerData(); 