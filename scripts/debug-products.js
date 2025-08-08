#!/usr/bin/env node

/**
 * Debug Products for POS System
 * Check if there are products in the database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Product status constants (must match Prisma enum)
const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  DISCONTINUED: "DISCONTINUED",
};
async function checkProducts() {
  console.log("🔍 Checking Products in Database...\n");

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
        cost: true,
        stock: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    console.log(`📊 Found ${products.length} products in database:\n`);

    if (products.length === 0) {
      console.log("❌ No products found in database!");
      console.log("🔧 This explains why POS search returns empty results.");
      console.log("\n💡 Solutions:");
      console.log("1. Add some sample products to the database");
      console.log("2. Use the inventory management system to create products");
      console.log("3. Import products from a CSV file");
      return;
    }

    products.forEach((product, index) => {
      console.log(`📦 Product ${index + 1}:`);
      console.log(`   Name: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Barcode: ${product.barcode || "N/A"}`);
      console.log(`   Price: ₦${product.price}`);
      console.log(`   Cost: ₦${product.cost}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Category: ${product.category?.name || "N/A"}`);
      console.log(`   Brand: ${product.brand?.name || "N/A"}`);
      console.log(`   Created: ${product.createdAt}`);
      console.log("");
    });

    // Check active products specifically
    const activeProducts = await prisma.product.count({
      where: {
        status: PRODUCT_STATUS.ACTIVE,
      },
    });

    console.log(`✅ Active products: ${activeProducts}`);

    // Check if there are any categories and brands
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();

    console.log(`📂 Categories: ${categoryCount}`);
    console.log(`🏷️  Brands: ${brandCount}`);

    if (activeProducts === 0) {
      console.log("\n⚠️  No active products found!");
      console.log(
        "🔧 This might explain why POS search returns empty results."
      );
    }
  } catch (error) {
    console.error("❌ Error checking products:", error);
  }
}

async function addSampleProducts() {
  console.log("\n🔧 Adding sample products for testing...\n");

  try {
    // First, check if we have categories and brands
    let category = await prisma.category.findFirst();
    let brand = await prisma.brand.findFirst();

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Electronics",
          description: "Electronic devices and gadgets",
        },
      });
      console.log("✅ Created sample category: Electronics");
    }

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: "Apple",
          description: "Apple Inc. products",
        },
      });
      console.log("✅ Created sample brand: Apple");
    }

    // Add sample products
    const sampleProducts = [
      {
        name: "iPhone 15 Pro",
        description: "Latest iPhone with Pro features",
        sku: "IPH15PRO001",
        barcode: "1234567890123",
        cost: 800000,
        price: 1200000,
        stock: 25,
        minStock: 5,
        unit: "piece",
        status: PRODUCT_STATUS.ACTIVE,
        categoryId: category.id,
        brandId: brand.id,
      },
      {
        name: "iPhone 15",
        description: "Standard iPhone 15",
        sku: "IPH15STD001",
        barcode: "1234567890124",
        cost: 650000,
        price: 950000,
        stock: 30,
        minStock: 10,
        unit: "piece",
        status: PRODUCT_STATUS.ACTIVE,
        categoryId: category.id,
        brandId: brand.id,
      },
      {
        name: "MacBook Pro 16",
        description: "Professional laptop",
        sku: "MBP16001",
        barcode: "1234567890125",
        cost: 1500000,
        price: 2200000,
        stock: 10,
        minStock: 2,
        unit: "piece",
        status: PRODUCT_STATUS.ACTIVE,
        categoryId: category.id,
        brandId: brand.id,
      },
    ];

    for (const productData of sampleProducts) {
      // Check if product already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: productData,
        });
        console.log(`✅ Created product: ${productData.name}`);
      } else {
        console.log(`⚠️  Product already exists: ${productData.name}`);
      }
    }

    console.log("\n🎉 Sample products added successfully!");
  } catch (error) {
    console.error("❌ Error adding sample products:", error);
  }
}

async function main() {
  console.log("🚀 Product Debug Tool");
  console.log("📡 Using Database via Prisma\n");

  await checkProducts();

  const totalProducts = await prisma.product.count();
  if (totalProducts === 0) {
    console.log(
      "\n❓ Would you like to add sample products? (Run again with 'add-samples' argument)"
    );
    console.log("Example: node scripts/debug-products.js add-samples");
  }

  // Check if user wants to add sample products
  if (process.argv.includes("add-samples")) {
    await addSampleProducts();
    console.log("\n🔄 Checking products again after adding samples...");
    await checkProducts();
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
