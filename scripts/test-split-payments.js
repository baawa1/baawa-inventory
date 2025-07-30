const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSplitPayments() {
  try {
    console.log('Testing split payments functionality...\n');

    // Create a test sales transaction with split payments
    const testTransaction = await prisma.salesTransaction.create({
      data: {
        subtotal: 456697.86,
        discount_amount: 0,
        total_amount: 456697.86,
        payment_method: 'split',
        payment_status: 'PAID',
        transaction_number: `TEST-SPLIT-${Date.now()}`,
        transaction_type: 'sale',
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
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

    const createdSplitPayments = await Promise.all(
      splitPayments.map(payment =>
        prisma.splitPayment.create({
          data: {
            ...payment,
            transaction_id: testTransaction.id,
          },
        })
      )
    );

    console.log('Created split payments:', createdSplitPayments.length);

    // Verify the split payments were saved
    const retrievedSplitPayments = await prisma.splitPayment.findMany({
      where: {
        transaction_id: testTransaction.id,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    console.log('\nRetrieved split payments:');
    retrievedSplitPayments.forEach(payment => {
      console.log(`- ${payment.payment_method}: ₦${Number(payment.amount).toLocaleString()}`);
    });

    // Calculate total
    const totalPaid = retrievedSplitPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    console.log(`\nTotal paid: ₦${totalPaid.toLocaleString()}`);
    console.log(`Transaction total: ₦${Number(testTransaction.total_amount).toLocaleString()}`);
    console.log(`Match: ${totalPaid === Number(testTransaction.total_amount) ? '✅' : '❌'}`);

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

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSplitPayments(); 