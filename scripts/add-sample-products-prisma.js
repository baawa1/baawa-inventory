#!/usr/bin/env node

/**
 * Add Sample Products with Barcodes to Supabase using Prisma
 * This script adds realistic product data with barcodes for testing the POS system
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
const sampleProducts = [
  {
    name: "iPhone 15 Pro Max Case - Leather Black",
    description:
      "Premium leather case for iPhone 15 Pro Max with precise cutouts",
    sku: "ACC-IPH15-LTH-BLK",
    barcode: "1234567890123",
    price: 8500.0, // ₦8,500
    cost: 4500.0,
    stock: 25,
    minStock: 5,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Phone Cases",
    brandName: "Premium Guard",
  },
  {
    name: "Samsung Galaxy S24 Ultra Screen Protector",
    description:
      "Tempered glass screen protector with anti-fingerprint coating",
    sku: "ACC-SAM24-SCR-TMP",
    barcode: "2345678901234",
    price: 3200.0, // ₦3,200
    cost: 1500.0,
    stock: 50,
    minStock: 10,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Screen Protectors",
    brandName: "GlassShield",
  },
  {
    name: "Wireless Charging Pad - 15W Fast Charge",
    description:
      "Universal wireless charging pad compatible with Qi-enabled devices",
    sku: "ACC-CHG-WRL-15W",
    barcode: "3456789012345",
    price: 6800.0, // ₦6,800
    cost: 3200.0,
    stock: 18,
    minStock: 3,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Chargers",
    brandName: "PowerTech",
  },
  {
    name: "Bluetooth Earbuds - Pro Series",
    description: "True wireless earbuds with active noise cancellation",
    sku: "ACC-EAR-BT-PRO",
    barcode: "4567890123456",
    price: 15500.0, // ₦15,500
    cost: 8000.0,
    stock: 12,
    minStock: 2,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Audio",
    brandName: "SoundMax",
  },
  {
    name: "USB-C to Lightning Cable - 2M",
    description:
      "High-quality braided cable for fast charging and data transfer",
    sku: "ACC-CBL-USBC-LTG",
    barcode: "5678901234567",
    price: 4200.0, // ₦4,200
    cost: 1800.0,
    stock: 35,
    minStock: 8,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Cables",
    brandName: "ConnectPro",
  },
  {
    name: "Phone Ring Stand - Magnetic Mount",
    description:
      "360° rotating ring stand with magnetic car mount compatibility",
    sku: "ACC-RNG-MAG-STD",
    barcode: "6789012345678",
    price: 2800.0, // ₦2,800
    cost: 1200.0,
    stock: 40,
    minStock: 10,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Stands & Mounts",
    brandName: "GripTech",
  },
  {
    name: "Apple Watch Band - Sport Loop Black",
    description: "Comfortable sport loop band for Apple Watch Series 6-9",
    sku: "ACC-AW-SLB-BLK",
    barcode: "7890123456789",
    price: 5200.0, // ₦5,200
    cost: 2500.0,
    stock: 22,
    minStock: 5,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Watch Bands",
    brandName: "BandCraft",
  },
  {
    name: "Portable Power Bank - 20000mAh",
    description: "High-capacity power bank with dual USB-A and USB-C ports",
    sku: "ACC-PWB-20K-DUL",
    barcode: "8901234567890",
    price: 12800.0, // ₦12,800
    cost: 6500.0,
    stock: 15,
    minStock: 3,
    status: PRODUCT_STATUS.ACTIVE,
    categoryName: "Power Banks",
    brandName: "ChargeMax",
  },
];

async function createCategoriesAndBrands() {
  console.log("🏷️ Creating categories and brands...");

  // Extract unique categories and brands
  const categories = [...new Set(sampleProducts.map((p) => p.categoryName))];
  const brands = [...new Set(sampleProducts.map((p) => p.brandName))];

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

async function createProducts() {
  console.log("\n📱 Adding sample products with barcodes...");

  for (const productData of sampleProducts) {
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
      const product = await prisma.product.create({
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
        },
      });

      console.log(`✅ Created: ${product.name} (${product.barcode})`);
    } catch (error) {
      console.error(`❌ Error creating ${productData.name}:`, error.message);
    }
  }
}

async function testBarcodeQueries() {
  console.log("\n🔍 Testing barcode queries...");

  // Test a few barcode lookups
  const testBarcodes = ["1234567890123", "2345678901234", "3456789012345"];

  for (const barcode of testBarcodes) {
    try {
      const product = await prisma.product.findFirst({
        where: {
          barcode: barcode,
          status: PRODUCT_STATUS.ACTIVE,
        },
        include: {
          category: true,
          brand: true,
        },
      });

      if (product) {
        console.log(
          `✅ Barcode ${barcode}: ${product.name} - ₦${product.price.toLocaleString()}`
        );
      } else {
        console.log(`❌ Barcode ${barcode}: Not found`);
      }
    } catch (error) {
      console.error(`❌ Error testing barcode ${barcode}:`, error.message);
    }
  }
}

async function displaySummary() {
  console.log("\n📊 Database Summary:");

  try {
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();
    const activeProducts = await prisma.product.count({
      where: { status: PRODUCT_STATUS.ACTIVE },
    });
    const productsWithBarcodes = await prisma.product.count({
      where: {
        barcode: { not: null },
        status: PRODUCT_STATUS.ACTIVE,
      },
    });

    console.log(`📦 Total Products: ${productCount}`);
    console.log(`🏷️ Categories: ${categoryCount}`);
    console.log(`🏢 Brands: ${brandCount}`);
    console.log(`✅ Active Products: ${activeProducts}`);
    console.log(`📱 Products with Barcodes: ${productsWithBarcodes}`);

    // Show total inventory value
    const inventoryValue = await prisma.product.aggregate({
      where: { status: PRODUCT_STATUS.ACTIVE },
      _sum: {
        price: true,
      },
    });

    if (inventoryValue._sum.price) {
      console.log(
        `💰 Total Inventory Value: ₦${inventoryValue._sum.price.toLocaleString()}`
      );
    }
  } catch (error) {
    console.error("❌ Error getting summary:", error.message);
  }
}

async function main() {
  console.log("🚀 Setting up POS Test Data with Barcodes");
  console.log("📡 Using Supabase Remote Database via Prisma\n");

  try {
    await createCategoriesAndBrands();
    await createProducts();
    await testBarcodeQueries();
    await displaySummary();

    console.log("\n🎉 Sample data setup complete!");
    console.log("\n🔄 Next Steps:");
    console.log("1. Test barcode scanning in POS system");
    console.log("2. Use camera to scan the barcodes");
    console.log("3. Process test transactions");
    console.log("4. Verify stock deductions");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
