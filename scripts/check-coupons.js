const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoupons() {
  try {
    console.log('🔍 Checking for coupons in the database...\n');

    // Check if there are any sales items with coupons
    const salesItemsWithCoupons = await prisma.salesItem.findMany({
      where: {
        coupon_id: { not: null }
      },
      include: {
        coupon: true,
        sales_transactions: {
          select: {
            customer_email: true,
            transaction_number: true,
            created_at: true
          }
        }
      },
      take: 5
    });

    console.log(`📊 Sales items with coupons: ${salesItemsWithCoupons.length}`);
    
    if (salesItemsWithCoupons.length > 0) {
      console.log('\n📋 Sample sales item with coupon:');
      console.log(JSON.stringify(salesItemsWithCoupons[0], null, 2));
    } else {
      console.log('❌ No sales items with coupons found');
    }

    // Check all coupons
    const coupons = await prisma.coupon.findMany({
      take: 5
    });
    console.log(`\n🎫 Available coupons: ${coupons.length}`);
    if (coupons.length > 0) {
      console.log('\n📋 Sample coupon:');
      console.log(JSON.stringify(coupons[0], null, 2));
    }

    // Check recent sales transactions
    const recentSales = await prisma.salesTransaction.findMany({
      where: {
        discount_amount: { gt: 0 }
      },
      include: {
        sales_items: {
          include: {
            coupon: true
          }
        }
      },
      take: 3,
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`\n💰 Recent sales with discounts: ${recentSales.length}`);
    if (recentSales.length > 0) {
      console.log('\n📋 Sample sale with discount:');
      const sale = recentSales[0];
      console.log(`Transaction: ${sale.transaction_number}`);
      console.log(`Customer: ${sale.customer_email}`);
      console.log(`Discount: ${sale.discount_amount}`);
      console.log(`Items with coupons: ${sale.sales_items.filter(item => item.coupon).length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoupons(); 