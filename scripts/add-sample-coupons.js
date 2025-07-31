const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleCoupons() {
  try {
    console.log('Adding sample coupons...');

    // Get the first admin user to use as createdBy
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    const sampleCoupons = [
      {
        code: 'SAVE10',
        name: '10% Off All Items',
        description: 'Get 10% off your entire purchase',
        type: 'PERCENTAGE',
        value: 10,
        minimumAmount: 5000, // ₦5,000 minimum
        maxUses: 100,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: adminUser.id,
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on orders over ₦10,000',
        type: 'FIXED',
        value: 2000, // ₦2,000 shipping discount
        minimumAmount: 10000, // ₦10,000 minimum
        maxUses: 50,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        createdBy: adminUser.id,
      },
      {
        code: 'WELCOME20',
        name: 'Welcome Discount',
        description: '20% off for new customers',
        type: 'PERCENTAGE',
        value: 20,
        minimumAmount: 2000, // ₦2,000 minimum
        maxUses: 200,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        createdBy: adminUser.id,
      },
      {
        code: 'FLASH50',
        name: 'Flash Sale 50% Off',
        description: 'Limited time 50% off selected items',
        type: 'PERCENTAGE',
        value: 50,
        minimumAmount: 1000, // ₦1,000 minimum
        maxUses: 25,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdBy: adminUser.id,
      },
      {
        code: 'LOYALTY15',
        name: 'Loyalty Customer Discount',
        description: '15% off for returning customers',
        type: 'PERCENTAGE',
        value: 15,
        minimumAmount: 3000, // ₦3,000 minimum
        maxUses: null, // Unlimited uses
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdBy: adminUser.id,
      },
      {
        code: 'EXPIRED',
        name: 'Expired Coupon',
        description: 'This coupon has expired for testing',
        type: 'PERCENTAGE',
        value: 25,
        minimumAmount: 1000,
        maxUses: 10,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdBy: adminUser.id,
      },
      {
        code: 'INACTIVE',
        name: 'Inactive Coupon',
        description: 'This coupon is inactive for testing',
        type: 'FIXED',
        value: 1000,
        minimumAmount: 5000,
        maxUses: 20,
        currentUses: 0,
        isActive: false,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: adminUser.id,
      },
    ];

    for (const couponData of sampleCoupons) {
      try {
        const coupon = await prisma.coupon.create({
          data: couponData,
        });
        console.log(`✅ Created coupon: ${coupon.code} - ${coupon.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Coupon ${couponData.code} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating coupon ${couponData.code}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Sample coupons added successfully!');
    console.log('\nAvailable coupon codes for testing:');
    console.log('- SAVE10 (10% off, min ₦5,000)');
    console.log('- FREESHIP (₦2,000 off, min ₦10,000)');
    console.log('- WELCOME20 (20% off, min ₦2,000)');
    console.log('- FLASH50 (50% off, min ₦1,000)');
    console.log('- LOYALTY15 (15% off, min ₦3,000)');
    console.log('- EXPIRED (expired coupon for testing)');
    console.log('- INACTIVE (inactive coupon for testing)');

  } catch (error) {
    console.error('Error adding sample coupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleCoupons(); 