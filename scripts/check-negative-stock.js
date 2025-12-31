#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNegativeStock() {
  try {
    console.log('🔍 Checking for products with negative stock...\n');

    // Check for negative stock
    const negativeStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
    });

    // Check for negative min_stock
    const negativeMinStockProducts = await prisma.product.findMany({
      where: {
        minStock: {
          lt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        minStock: true,
      },
    });

    console.log(`Products with negative stock: ${negativeStockProducts.length}`);
    if (negativeStockProducts.length > 0) {
      console.log('\n⚠️  Products with negative stock:');
      negativeStockProducts.forEach(product => {
        console.log(`   - ${product.name} (SKU: ${product.sku}): stock = ${product.stock}`);
      });
    }

    console.log(`\nProducts with negative min_stock: ${negativeMinStockProducts.length}`);
    if (negativeMinStockProducts.length > 0) {
      console.log('\n⚠️  Products with negative min_stock:');
      negativeMinStockProducts.forEach(product => {
        console.log(`   - ${product.name} (SKU: ${product.sku}): min_stock = ${product.minStock}`);
      });
    }

    if (negativeStockProducts.length === 0 && negativeMinStockProducts.length === 0) {
      console.log('\n✅ No products with negative stock or min_stock found.');
      console.log('✅ Safe to apply CHECK constraint migration.\n');
    } else {
      console.log('\n⚠️  WARNING: Found products with negative values!');
      console.log('⚠️  You must fix these before applying the CHECK constraint.\n');
      console.log('Fix options:');
      console.log('  1. Update negative stock to 0 (recommended for oversold products)');
      console.log('  2. Adjust to correct positive values if data entry error\n');
    }

    // Get total product count for context
    const totalProducts = await prisma.product.count();
    console.log(`Total products in database: ${totalProducts}\n`);

  } catch (error) {
    console.error('❌ Error checking stock:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkNegativeStock();
