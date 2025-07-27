/**
 * Script to add test customer data to sales transactions
 * This will create sample sales transactions with customer information
 * so the customer search functionality can be tested properly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test customer data that matches your user table
const testCustomers = [
  {
    name: 'Joshua Thomas',
    email: 'baawapay+joshua.thomas@gmail.com',
    phone: '09062690013',
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '08012345678',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '09087654321',
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@test.com',
    phone: '07055556666',
  },
  {
    name: 'Alice Brown',
    email: 'alice.brown@email.com',
    phone: '08123456789',
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie.wilson@company.com',
    phone: '09123456789',
  },
];

// Sample products for transactions
const sampleProducts = [
  { name: 'Test Product 1', price: 1500, stock: 100 },
  { name: 'Test Product 2', price: 2500, stock: 50 },
  { name: 'Test Product 3', price: 3500, stock: 75 },
];

async function createTestProducts() {
  console.log('📦 Creating test products...');
  
  const products = [];
  for (const product of sampleProducts) {
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        price: product.price,
        stock: product.stock,
        status: 'ACTIVE',
        isArchived: false,
      },
    });
    products.push(createdProduct);
    console.log(`   Created product: ${product.name}`);
  }
  
  return products;
}

async function createTestSalesTransactions(customers, products) {
  console.log('💰 Creating test sales transactions...');
  
  // Get a user to assign as the cashier
  const user = await prisma.user.findFirst({
    where: { role: 'STAFF' },
    select: { id: true },
  });
  
  if (!user) {
    console.log('❌ No staff user found. Please create a staff user first.');
    return [];
  }
  
  const transactions = [];
  
  for (const customer of testCustomers) {
    // Create 1-3 transactions per customer
    const transactionCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < transactionCount; i++) {
      const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const subtotal = Math.floor(Math.random() * 10000) + 1000; // 1000-11000
      const discount = Math.floor(Math.random() * 500); // 0-500
      const total = subtotal - discount;
      
      const transaction = await prisma.salesTransaction.create({
        data: {
          transaction_number: transactionNumber,
          subtotal: subtotal,
          discount_amount: discount,
          total_amount: total,
          payment_method: 'cash',
          payment_status: 'PAID',
          transaction_type: 'sale',
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          notes: `Test transaction ${i + 1} for ${customer.name}`,
          user_id: user.id,
        },
      });
      
      // Create sales items for this transaction
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;
        
        await prisma.salesItem.create({
          data: {
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            discount_amount: 0,
            transaction_id: transaction.id,
            product_id: product.id,
          },
        });
      }
      
      transactions.push(transaction);
      console.log(`   Created transaction for ${customer.name}: ${transactionNumber}`);
    }
  }
  
  return transactions;
}

async function main() {
  try {
    console.log('🚀 Starting test customer data creation...\n');
    
    // Create test products
    const products = await createTestProducts();
    console.log(`✅ Created ${products.length} products\n`);
    
    // Create test sales transactions with customer data
    const transactions = await createTestSalesTransactions(testCustomers, products);
    console.log(`✅ Created ${transactions.length} sales transactions\n`);
    
    console.log('🎉 Test customer data creation completed!');
    console.log('\n📋 Test customers created:');
    testCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} - ${customer.email} - ${customer.phone}`);
    });
    
    console.log('\n🧪 You can now test the customer search functionality:');
    console.log('   1. Go to POS system');
    console.log('   2. Start a new transaction');
    console.log('   3. Enter customer information (email or phone)');
    console.log('   4. The system should detect existing customers');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main(); 