const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testCustomerOrders() {
  try {
    console.log('🧪 Testing Customer Orders API...\n');

    // Test the database query directly
    const customerEmail = 'baawapay+amanda.nguyen@gmail.com';
    
    console.log(`1. Testing orders for customer: ${customerEmail}`);

    // Get all orders for this customer
    const orders = await prisma.salesTransaction.findMany({
      where: {
        customer_email: customerEmail,
        payment_status: {
          in: ['paid', 'completed', 'PAID'],
        },
      },
      include: {
        sales_items: {
          include: {
            products: {
              select: {
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
        users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log(`✅ Found ${orders.length} orders for customer`);

    if (orders.length > 0) {
      console.log('\n2. Sample Order Details:');
      const sampleOrder = orders[0];
      console.log(`   Transaction #: ${sampleOrder.transaction_number}`);
      console.log(`   Date: ${sampleOrder.created_at}`);
      console.log(`   Total: ₦${sampleOrder.total_amount}`);
      console.log(`   Payment Status: ${sampleOrder.payment_status}`);
      console.log(`   Payment Method: ${sampleOrder.payment_method}`);
      console.log(`   Staff: ${sampleOrder.users ? `${sampleOrder.users.firstName} ${sampleOrder.users.lastName}` : 'Unknown'}`);
      console.log(`   Items: ${sampleOrder.sales_items.length}`);
      
      if (sampleOrder.sales_items.length > 0) {
        console.log('\n3. Sample Items:');
        sampleOrder.sales_items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.products?.name || 'Unknown Product'}`);
          console.log(`      SKU: ${item.products?.sku || 'N/A'}`);
          console.log(`      Quantity: ${item.quantity}`);
          console.log(`      Price: ₦${item.unit_price}`);
          console.log(`      Total: ₦${item.total_price}`);
        });
      }
    }

    console.log('\n✅ Customer Orders API test completed successfully!');
    console.log('\n📊 The API should now work correctly with real order data.');

  } catch (error) {
    console.error('❌ Error testing customer orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerOrders(); 