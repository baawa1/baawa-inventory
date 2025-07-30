const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testCustomerDuplicates() {
  try {
    console.log('🧪 Testing Customer Duplicates Fix...\n');

    // Test the old query (grouping by email, name, phone)
    console.log('1. Testing old query (grouping by email, name, phone):');
    const oldQuery = await prisma.salesTransaction.groupBy({
      by: ['customer_email', 'customer_name', 'customer_phone'],
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'],
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
    });

    console.log(`   Found ${oldQuery.length} customer combinations`);
    
    // Check for duplicates by email
    const emailCounts = {};
    oldQuery.forEach(customer => {
      const email = customer.customer_email;
      emailCounts[email] = (emailCounts[email] || 0) + 1;
    });

    const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    console.log(`   Found ${duplicates.length} emails with duplicates:`);
    duplicates.forEach(([email, count]) => {
      console.log(`     ${email}: ${count} entries`);
    });

    // Test the new query (grouping only by email)
    console.log('\n2. Testing new query (grouping only by email):');
    const newQuery = await prisma.salesTransaction.groupBy({
      by: ['customer_email'],
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'],
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
    });

    console.log(`   Found ${newQuery.length} unique customers`);
    
    // Check for duplicates by email
    const newEmailCounts = {};
    newQuery.forEach(customer => {
      const email = customer.customer_email;
      newEmailCounts[email] = (newEmailCounts[email] || 0) + 1;
    });

    const newDuplicates = Object.entries(newEmailCounts).filter(([email, count]) => count > 1);
    console.log(`   Found ${newDuplicates.length} emails with duplicates:`);
    newDuplicates.forEach(([email, count]) => {
      console.log(`     ${email}: ${count} entries`);
    });

    if (newDuplicates.length === 0) {
      console.log('\n✅ SUCCESS: No duplicate emails found in new query!');
    } else {
      console.log('\n❌ ISSUE: Still found duplicate emails in new query');
    }

    console.log('\n📊 Summary:');
    console.log(`   Old query: ${oldQuery.length} combinations, ${duplicates.length} duplicate emails`);
    console.log(`   New query: ${newQuery.length} customers, ${newDuplicates.length} duplicate emails`);

  } catch (error) {
    console.error('❌ Error testing customer duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerDuplicates(); 