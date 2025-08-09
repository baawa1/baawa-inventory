const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TEST_CUSTOMERS = [
  {
    name: 'Test User',
    email: 'baawapays+test2@gmail.com',
    phone: '07094872345',
    billingAddress: '123 Test Street',
    city: 'Lagos',
    state: 'Lagos',
    postalCode: '100001',
    country: 'Nigeria',
    customerType: 'individual',
    notes: 'Test customer for development',
    isActive: true,
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '08012345678',
    billingAddress: '456 Sample Avenue',
    shippingAddress: '789 Delivery Lane',
    city: 'Abuja',
    state: 'FCT',
    postalCode: '900001',
    country: 'Nigeria',
    customerType: 'individual',
    notes: 'Regular customer',
    isActive: true,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    phone: '09087654321',
    billingAddress: '321 Business District',
    city: 'Port Harcourt',
    state: 'Rivers',
    postalCode: '500001',
    country: 'Nigeria',
    customerType: 'business',
    notes: 'Corporate client',
    isActive: true,
  },
  {
    name: 'Mike Johnson',
    email: 'mike.j@email.com',
    phone: '07012345678',
    billingAddress: '654 Commercial Road',
    city: 'Kano',
    state: 'Kano',
    postalCode: '700001',
    country: 'Nigeria',
    customerType: 'individual',
    isActive: true,
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@test.com',
    phone: '08098765432',
    billingAddress: '987 Residential Close',
    shippingAddress: '147 Alternate Address',
    city: 'Ibadan',
    state: 'Oyo',
    postalCode: '200001',
    country: 'Nigeria',
    customerType: 'individual',
    notes: 'VIP customer with special shipping needs',
    isActive: true,
  }
];

async function addTestCustomers() {
  console.log('🚀 Adding test customers...');

  try {
    // Check if customers already exist
    for (const customerData of TEST_CUSTOMERS) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: customerData.email },
            { phone: customerData.phone }
          ]
        }
      });

      if (existingCustomer) {
        console.log(`✅ Customer ${customerData.name} (${customerData.email}) already exists`);
        continue;
      }

      const customer = await prisma.customer.create({
        data: customerData
      });

      console.log(`✅ Created customer: ${customer.name} (${customer.email})`);
    }

    // Show summary
    const totalCustomers = await prisma.customer.count({
      where: { isActive: true }
    });

    console.log(`\n📊 Total active customers in database: ${totalCustomers}`);
    console.log('🎉 Test customers setup complete!');

  } catch (error) {
    console.error('❌ Error adding test customers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestCustomers();