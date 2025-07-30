const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSplitPaymentsAPI() {
  try {
    console.log('Testing split payments API functionality...\n');

    // First, let's create a test transaction with split payments
    const testTransaction = await prisma.salesTransaction.create({
      data: {
        subtotal: 456697.86,
        discount_amount: 0,
        total_amount: 456697.86,
        payment_method: 'split',
        payment_status: 'PAID',
        transaction_number: `API-TEST-${Date.now()}`,
        transaction_type: 'sale',
        customer_name: 'API Test Customer',
        customer_email: 'api-test@example.com',
        user_id: 1, // Assuming user ID 1 exists
      },
    });

    console.log('Created test transaction:', testTransaction.id);

    // Create split payments
    const splitPayments = [
      { amount: 200000, payment_method: 'cash' },
      { amount: 200000, payment_method: 'bank_transfer' },
      { amount: 56697.86, payment_method: 'mobile_money' },
    ];

    await Promise.all(
      splitPayments.map(payment =>
        prisma.splitPayment.create({
          data: {
            ...payment,
            transaction_id: testTransaction.id,
          },
        })
      )
    );

    console.log('Created split payments for API test');

    // Test the API endpoint by simulating a fetch request
    const response = await fetch(`http://localhost:3000/api/pos/split-payments/${testTransaction.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need proper authentication headers
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('\nAPI Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.splitPayments) {
        console.log('\n✅ API test successful!');
        console.log('Retrieved split payments:');
        data.splitPayments.forEach(payment => {
          console.log(`- ${payment.method}: ₦${payment.amount.toLocaleString()}`);
        });
      } else {
        console.log('\n❌ API response format unexpected');
      }
    } else {
      console.log('\n❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }

    // Clean up test data
    await prisma.splitPayment.deleteMany({
      where: {
        transaction_id: testTransaction.id,
      },
    });

    await prisma.salesTransaction.delete({
      where: {
        id: testTransaction.id,
      },
    });

    console.log('\n✅ API test completed!');
  } catch (error) {
    console.error('❌ API test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSplitPaymentsAPI(); 