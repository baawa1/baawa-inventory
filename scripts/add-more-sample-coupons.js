const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMoreSampleCoupons() {
  try {
    console.log('Adding more sample coupons for pagination testing...');

    // Get the first admin user to use as createdBy
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    const additionalCoupons = [
      // Seasonal Coupons
      {
        code: 'SUMMER25',
        name: 'Summer Sale 25% Off',
        description: 'Perfect for summer shopping',
        type: 'PERCENTAGE',
        value: 25,
        minimumAmount: 3000,
        maxUses: 75,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        createdBy: adminUser.id,
      },
      {
        code: 'WINTER30',
        name: 'Winter Warmth 30% Off',
        description: 'Stay warm this winter',
        type: 'PERCENTAGE',
        value: 30,
        minimumAmount: 4000,
        maxUses: 60,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
        createdBy: adminUser.id,
      },
      {
        code: 'SPRING20',
        name: 'Spring Refresh 20% Off',
        description: 'Fresh start this spring',
        type: 'PERCENTAGE',
        value: 20,
        minimumAmount: 2500,
        maxUses: 100,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days
        createdBy: adminUser.id,
      },
      {
        code: 'AUTUMN15',
        name: 'Autumn Collection 15% Off',
        description: 'Fall into savings',
        type: 'PERCENTAGE',
        value: 15,
        minimumAmount: 2000,
        maxUses: 80,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000), // 110 days
        createdBy: adminUser.id,
      },

      // Fixed Amount Coupons
      {
        code: 'SAVE500',
        name: 'Save ₦500',
        description: 'Fixed ₦500 discount',
        type: 'FIXED',
        value: 500,
        minimumAmount: 2000,
        maxUses: 200,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        createdBy: adminUser.id,
      },
      {
        code: 'SAVE1000',
        name: 'Save ₦1,000',
        description: 'Fixed ₦1,000 discount',
        type: 'FIXED',
        value: 1000,
        minimumAmount: 5000,
        maxUses: 150,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000), // 70 days
        createdBy: adminUser.id,
      },
      {
        code: 'SAVE1500',
        name: 'Save ₦1,500',
        description: 'Fixed ₦1,500 discount',
        type: 'FIXED',
        value: 1500,
        minimumAmount: 7500,
        maxUses: 100,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), // 80 days
        createdBy: adminUser.id,
      },
      {
        code: 'SAVE3000',
        name: 'Save ₦3,000',
        description: 'Fixed ₦3,000 discount',
        type: 'FIXED',
        value: 3000,
        minimumAmount: 15000,
        maxUses: 50,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        createdBy: adminUser.id,
      },

      // Special Event Coupons
      {
        code: 'BIRTHDAY40',
        name: 'Birthday Special 40% Off',
        description: 'Celebrate your birthday with us',
        type: 'PERCENTAGE',
        value: 40,
        minimumAmount: 1000,
        maxUses: 25,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdBy: adminUser.id,
      },
      {
        code: 'FIRSTTIME35',
        name: 'First Time Customer 35% Off',
        description: 'Special discount for new customers',
        type: 'PERCENTAGE',
        value: 35,
        minimumAmount: 1500,
        maxUses: 100,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        createdBy: adminUser.id,
      },
      {
        code: 'VIP45',
        name: 'VIP Customer 45% Off',
        description: 'Exclusive discount for VIP customers',
        type: 'PERCENTAGE',
        value: 45,
        minimumAmount: 5000,
        maxUses: 30,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000), // 200 days
        createdBy: adminUser.id,
      },
      {
        code: 'WEEKEND25',
        name: 'Weekend Special 25% Off',
        description: 'Weekend shopping discount',
        type: 'PERCENTAGE',
        value: 25,
        minimumAmount: 2000,
        maxUses: 120,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), // 150 days
        createdBy: adminUser.id,
      },

      // Category Specific Coupons
      {
        code: 'ELECTRONICS20',
        name: 'Electronics 20% Off',
        description: 'Discount on all electronics',
        type: 'PERCENTAGE',
        value: 20,
        minimumAmount: 8000,
        maxUses: 80,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
        createdBy: adminUser.id,
      },
      {
        code: 'FASHION30',
        name: 'Fashion 30% Off',
        description: 'Style yourself with savings',
        type: 'PERCENTAGE',
        value: 30,
        minimumAmount: 3000,
        maxUses: 90,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days
        createdBy: adminUser.id,
      },
      {
        code: 'HOME25',
        name: 'Home & Living 25% Off',
        description: 'Make your home beautiful',
        type: 'PERCENTAGE',
        value: 25,
        minimumAmount: 4000,
        maxUses: 70,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000), // 110 days
        createdBy: adminUser.id,
      },
      {
        code: 'SPORTS35',
        name: 'Sports & Fitness 35% Off',
        description: 'Stay active with savings',
        type: 'PERCENTAGE',
        value: 35,
        minimumAmount: 2500,
        maxUses: 60,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 130 * 24 * 60 * 60 * 1000), // 130 days
        createdBy: adminUser.id,
      },

      // Bulk Purchase Coupons
      {
        code: 'BULK40',
        name: 'Bulk Purchase 40% Off',
        description: 'Save more when you buy more',
        type: 'PERCENTAGE',
        value: 40,
        minimumAmount: 20000,
        maxUses: 40,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 160 * 24 * 60 * 60 * 1000), // 160 days
        createdBy: adminUser.id,
      },
      {
        code: 'BULK50',
        name: 'Bulk Purchase 50% Off',
        description: 'Maximum savings on bulk orders',
        type: 'PERCENTAGE',
        value: 50,
        minimumAmount: 50000,
        maxUses: 20,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        createdBy: adminUser.id,
      },

      // Flash Sale Coupons
      {
        code: 'FLASH60',
        name: 'Flash Sale 60% Off',
        description: 'Limited time flash sale',
        type: 'PERCENTAGE',
        value: 60,
        minimumAmount: 1000,
        maxUses: 15,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        createdBy: adminUser.id,
      },
      {
        code: 'FLASH70',
        name: 'Flash Sale 70% Off',
        description: 'Super flash sale - act fast!',
        type: 'PERCENTAGE',
        value: 70,
        minimumAmount: 2000,
        maxUses: 10,
        currentUses: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        createdBy: adminUser.id,
      },

      // Some inactive coupons for testing
      {
        code: 'INACTIVE1',
        name: 'Inactive Coupon 1',
        description: 'Testing inactive status',
        type: 'PERCENTAGE',
        value: 10,
        minimumAmount: 1000,
        maxUses: 50,
        currentUses: 0,
        isActive: false,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: adminUser.id,
      },
      {
        code: 'INACTIVE2',
        name: 'Inactive Coupon 2',
        description: 'Another inactive coupon',
        type: 'FIXED',
        value: 500,
        minimumAmount: 2000,
        maxUses: 30,
        currentUses: 0,
        isActive: false,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        createdBy: adminUser.id,
      },
    ];

    // Check for existing coupons to avoid duplicates
    for (const couponData of additionalCoupons) {
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: couponData.code }
      });

      if (!existingCoupon) {
        await prisma.coupon.create({
          data: couponData
        });
        console.log(`✅ Created coupon: ${couponData.code} - ${couponData.name}`);
      } else {
        console.log(`⏭️  Skipped existing coupon: ${couponData.code}`);
      }
    }

    // Get total count
    const totalCoupons = await prisma.coupon.count();
    console.log(`\n🎉 Additional sample coupons added successfully!`);
    console.log(`📊 Total coupons in database: ${totalCoupons}`);

  } catch (error) {
    console.error('Error adding sample coupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreSampleCoupons(); 