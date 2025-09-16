#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log("📊 Database Data Summary:");

    const userCount = await prisma.user.count();
    const supplierCount = await prisma.supplier.count();
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();
    const productCount = await prisma.product.count();
    const customerCount = await prisma.customer.count();
    const transactionCount = await prisma.salesTransaction.count();
    const salesItemCount = await prisma.salesItem.count();
    const stockAdditionCount = await prisma.stockAddition.count();
    const stockAdjustmentCount = await prisma.stockAdjustment.count();
    const financialTransactionCount = await prisma.financialTransaction.count();

    console.log(`- Users: ${userCount}`);
    console.log(`- Suppliers: ${supplierCount}`);
    console.log(`- Categories: ${categoryCount}`);
    console.log(`- Brands: ${brandCount}`);
    console.log(`- Products: ${productCount}`);
    console.log(`- Customers: ${customerCount}`);
    console.log(`- Sales Transactions: ${transactionCount}`);
    console.log(`- Sales Items: ${salesItemCount}`);
    console.log(`- Stock Additions: ${stockAdditionCount}`);
    console.log(`- Stock Adjustments: ${stockAdjustmentCount}`);
    console.log(`- Financial Transactions: ${financialTransactionCount}`);

    console.log("\n✨ Sample users with baawapay emails:");
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        userStatus: true,
        createdAt: true
      }
    });

    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.userStatus} - ${user.createdAt?.getFullYear() || 'No date'}`);
    });

    console.log("\n📦 Sample products:");
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        category: true,
        brand: true
      }
    });

    products.forEach(product => {
      console.log(`- ${product.name} - ${product.category?.name} - ${product.brand?.name} - ₦${product.price} - Created: ${product.createdAt?.getFullYear() || 'No date'}`);
    });

  } catch (error) {
    console.error("❌ Error checking data:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();