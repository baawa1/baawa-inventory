#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStockConstraint() {
  try {
    console.log('🧪 Testing stock non-negative constraint...\n');

    // Find a product to test with
    const product = await prisma.product.findFirst({
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      console.log('No products found to test with');
      return;
    }

    console.log(`Testing with product: ${product.name}`);
    console.log(`Current stock: ${product.stock}\n`);

    // Test 1: Try to set stock to -1 (should fail)
    console.log('Test 1: Attempting to set stock to -1 (should fail)...');
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: -1 },
      });
      console.log('❌ FAILED: Constraint did not prevent negative stock!\n');
    } catch (error) {
      if (error.message.includes('check_stock_non_negative')) {
        console.log('✅ PASSED: Constraint prevented negative stock\n');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // Test 2: Try to decrement stock below 0 (should fail)
    console.log('Test 2: Attempting to decrement stock below 0 (should fail)...');
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: product.stock + 1 } },
      });
      console.log('❌ FAILED: Constraint did not prevent negative stock from decrement!\n');
    } catch (error) {
      if (error.message.includes('check_stock_non_negative')) {
        console.log('✅ PASSED: Constraint prevented stock from going negative\n');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // Test 3: Try to set min_stock to -1 (should fail)
    console.log('Test 3: Attempting to set min_stock to -1 (should fail)...');
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { minStock: -1 },
      });
      console.log('❌ FAILED: Constraint did not prevent negative min_stock!\n');
    } catch (error) {
      if (error.message.includes('check_min_stock_non_negative')) {
        console.log('✅ PASSED: Constraint prevented negative min_stock\n');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}\n`);
      }
    }

    // Test 4: Valid update to stock = 0 (should succeed)
    console.log('Test 4: Attempting to set stock to 0 (should succeed)...');
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: 0 },
      });
      console.log('✅ PASSED: Stock set to 0 successfully\n');

      // Restore original stock
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: product.stock },
      });
      console.log(`Stock restored to ${product.stock}\n`);
    } catch (error) {
      console.log(`❌ FAILED: Could not set stock to 0: ${error.message}\n`);
    }

    console.log('✅ All constraint tests completed!\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testStockConstraint();
