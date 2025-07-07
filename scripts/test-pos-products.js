#!/usr/bin/env node

/**
 * Test POS Products API
 * Check if products are being fetched correctly for the POS system
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPOSProducts() {
  console.log("🔍 Testing POS Products API...\n");

  try {
    // First, check if products exist in the database
    const productsCount = await prisma.product.count({
      where: {
        status: "active",
        stock: {
          gt: 0,
        },
      },
    });

    console.log(`📊 Found ${productsCount} active products with stock > 0\n`);

    // Get a sample of products to verify structure
    const sampleProducts = await prisma.product.findMany({
      where: {
        status: "active",
        stock: {
          gt: 0,
        },
      },
      include: {
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
      },
      take: 5,
      orderBy: {
        name: "asc",
      },
    });

    console.log("📦 Sample Products for POS:");
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: ₦${product.price.toLocaleString()}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Category: ${product.category?.name || "No Category"}`);
      console.log(`   Brand: ${product.brand?.name || "No Brand"}`);
      console.log(`   Status: ${product.status}`);
      console.log("");
    });

    // Test the API endpoint format
    const formattedProducts = sampleProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category?.name || "Uncategorized",
      brand: product.brand?.name || "No Brand",
      imageUrl: product.imageUrl,
      description: product.description,
    }));

    console.log("🚀 API Response Format:");
    console.log(JSON.stringify(formattedProducts[0], null, 2));

    // Check categories and brands for filters
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: {
            products: {
              where: {
                status: "active",
                stock: {
                  gt: 0,
                },
              },
            },
          },
        },
      },
    });

    const brands = await prisma.brand.findMany({
      select: {
        name: true,
        _count: {
          select: {
            products: {
              where: {
                status: "active",
                stock: {
                  gt: 0,
                },
              },
            },
          },
        },
      },
    });

    console.log("\n📋 Available Categories:");
    categories.forEach((category) => {
      console.log(`   ${category.name} (${category._count.products} products)`);
    });

    console.log("\n🏷️  Available Brands:");
    brands.forEach((brand) => {
      console.log(`   ${brand.name} (${brand._count.products} products)`);
    });

    console.log("\n✅ POS Products API test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing POS products:", error);
  }
}

async function main() {
  console.log("🚀 POS Products API Test");
  console.log("📡 Using Supabase Remote Database via Prisma\n");

  await testPOSProducts();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
