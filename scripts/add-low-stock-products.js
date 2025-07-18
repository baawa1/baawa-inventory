#!/usr/bin/env node

/**
 * Add Low Stock Products for Testing
 * This script adds products with low stock levels to test the low stock alerts functionality
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const lowStockProducts = [
  {
    name: "iPhone 15 Pro Max Case - Out of Stock",
    description: "Premium leather case for iPhone 15 Pro Max - OUT OF STOCK",
    sku: "ACC-IPH15-LTH-BLK-OOS",
    barcode: "1234567890124",
    price: 8500.0,
    cost: 4500.0,
    stock: 0, // Out of stock
    minStock: 5,
    status: "active",
    categoryName: "Phone Cases",
    brandName: "Premium Guard",
  },
  {
    name: "Samsung Galaxy S24 Ultra Screen Protector - Critical",
    description: "Tempered glass screen protector - CRITICAL STOCK",
    sku: "ACC-SAM24-SCR-TMP-CRIT",
    barcode: "2345678901235",
    price: 3200.0,
    cost: 1500.0,
    stock: 1, // Critical stock (below 50% of minStock)
    minStock: 10,
    status: "active",
    categoryName: "Screen Protectors",
    brandName: "GlassShield",
  },
  {
    name: "Wireless Charging Pad - Low Stock",
    description: "Universal wireless charging pad - LOW STOCK",
    sku: "ACC-CHG-WRL-15W-LOW",
    barcode: "3456789012346",
    price: 6800.0,
    cost: 3200.0,
    stock: 2, // Low stock (at minStock level)
    minStock: 3,
    status: "active",
    categoryName: "Chargers",
    brandName: "PowerTech",
  },
  {
    name: "Bluetooth Earbuds - Critical Stock",
    description: "True wireless earbuds - CRITICAL STOCK",
    sku: "ACC-EAR-BT-PRO-CRIT",
    barcode: "4567890123457",
    price: 15500.0,
    cost: 8000.0,
    stock: 0, // Out of stock
    minStock: 2,
    status: "active",
    categoryName: "Audio",
    brandName: "SoundMax",
  },
  {
    name: "USB-C to Lightning Cable - Low Stock",
    description: "High-quality braided cable - LOW STOCK",
    sku: "ACC-CBL-USBC-LTG-LOW",
    barcode: "5678901234568",
    price: 4200.0,
    cost: 1800.0,
    stock: 4, // Low stock (below minStock)
    minStock: 8,
    status: "active",
    categoryName: "Cables",
    brandName: "ConnectPro",
  },
];

async function createCategoriesAndBrands() {
  console.log("🏷️ Creating categories and brands...");

  // Extract unique categories and brands
  const categories = [...new Set(lowStockProducts.map((p) => p.categoryName))];
  const brands = [...new Set(lowStockProducts.map((p) => p.brandName))];

  // Create categories
  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
        description: `${categoryName} category for mobile accessories`,
        isActive: true,
      },
    });
    console.log(`✅ Category: ${categoryName}`);
  }

  // Create brands
  for (const brandName of brands) {
    await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: {
        name: brandName,
        description: `${brandName} brand accessories`,
        isActive: true,
      },
    });
    console.log(`✅ Brand: ${brandName}`);
  }
}

async function createLowStockProducts() {
  console.log("\n📱 Adding low stock products for testing...");

  for (const productData of lowStockProducts) {
    try {
      // Get category and brand IDs
      const category = await prisma.category.findUnique({
        where: { name: productData.categoryName },
      });

      const brand = await prisma.brand.findUnique({
        where: { name: productData.brandName },
      });

      if (!category || !brand) {
        console.log(`❌ Missing category or brand for ${productData.name}`);
        continue;
      }

      // Check if product already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku },
      });

      if (existingProduct) {
        console.log(`⚠️ Product already exists: ${productData.name}`);
        continue;
      }

      // Create product
      await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          sku: productData.sku,
          barcode: productData.barcode,
          price: productData.price,
          cost: productData.cost,
          stock: productData.stock,
          minStock: productData.minStock,
          status: productData.status,
          categoryId: category.id,
          brandId: brand.id,
          isArchived: false,
        },
      });

      console.log(
        `✅ Added low stock product: ${productData.name} (Stock: ${productData.stock}/${productData.minStock})`
      );
    } catch (error) {
      console.error(`❌ Error creating product ${productData.name}:`, error);
    }
  }
}

async function displayLowStockSummary() {
  console.log("\n📊 Low Stock Summary:");

  const lowStockProducts = await prisma.product.findMany({
    where: {
      isArchived: false,
      OR: [{ stock: { lte: 0 } }, { stock: { lte: { minStock: true } } }],
    },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
  });

  console.log(`Total low stock products: ${lowStockProducts.length}`);

  for (const product of lowStockProducts) {
    const stockStatus =
      product.stock === 0
        ? "OUT OF STOCK"
        : product.stock <= product.minStock * 0.5
          ? "CRITICAL"
          : "LOW";
    console.log(
      `- ${product.name} (${product.sku}): ${product.stock}/${product.minStock} - ${stockStatus}`
    );
  }
}

async function main() {
  try {
    console.log("🚀 Starting low stock products creation...");

    await createCategoriesAndBrands();
    await createLowStockProducts();
    await displayLowStockSummary();

    console.log("\n✅ Low stock products creation completed!");
  } catch (error) {
    console.error("❌ Error in main function:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
