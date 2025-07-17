#!/usr/bin/env node

/**
 * Remove Test Data from Database
 * This script removes the sample categories and brands added by the test script
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Test categories and brands to remove
const testCategories = [
  "Phone Cases",
  "Screen Protectors",
  "Chargers",
  "Audio",
  "Cables",
  "Stands & Mounts",
  "Watch Bands",
  "Power Banks",
];

const testBrands = [
  "Premium Guard",
  "GlassShield",
  "PowerTech",
  "SoundMax",
  "ConnectPro",
  "GripTech",
  "BandCraft",
  "ChargeMax",
];

async function removeTestData() {
  console.log("🧹 Removing test data from database...\n");

  try {
    // Remove test categories
    console.log("🗑️ Removing test categories...");
    for (const categoryName of testCategories) {
      const category = await prisma.category.findUnique({
        where: { name: categoryName },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (category) {
        if (category._count.products > 0) {
          console.log(
            `⚠️  Cannot delete category "${categoryName}" - has ${category._count.products} products`
          );
        } else {
          await prisma.category.delete({
            where: { name: categoryName },
          });
          console.log(`✅ Deleted category: ${categoryName}`);
        }
      } else {
        console.log(`ℹ️  Category not found: ${categoryName}`);
      }
    }

    // Remove test brands
    console.log("\n🗑️ Removing test brands...");
    for (const brandName of testBrands) {
      const brand = await prisma.brand.findUnique({
        where: { name: brandName },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (brand) {
        if (brand._count.products > 0) {
          console.log(
            `⚠️  Cannot delete brand "${brandName}" - has ${brand._count.products} products`
          );
        } else {
          await prisma.brand.delete({
            where: { name: brandName },
          });
          console.log(`✅ Deleted brand: ${brandName}`);
        }
      } else {
        console.log(`ℹ️  Brand not found: ${brandName}`);
      }
    }

    // Remove test products
    console.log("\n🗑️ Removing test products...");
    const testProductSkus = [
      "ACC-IPH15-LTH-BLK",
      "ACC-SAM24-SCR-TMP",
      "ACC-CHG-WRL-15W",
      "ACC-EAR-BT-PRO",
      "ACC-CBL-USBC-LTG",
      "ACC-RNG-MAG-STD",
      "ACC-AW-SLB-BLK",
      "ACC-PWB-20K-DUL",
    ];

    for (const sku of testProductSkus) {
      const product = await prisma.product.findUnique({
        where: { sku },
      });

      if (product) {
        await prisma.product.delete({
          where: { sku },
        });
        console.log(`✅ Deleted product: ${product.name} (${sku})`);
      } else {
        console.log(`ℹ️  Product not found: ${sku}`);
      }
    }

    console.log("\n🎉 Test data cleanup completed!");

    // Show remaining data
    const remainingCategories = await prisma.category.count();
    const remainingBrands = await prisma.brand.count();
    const remainingProducts = await prisma.product.count();

    console.log("\n📊 Remaining data:");
    console.log(`   Categories: ${remainingCategories}`);
    console.log(`   Brands: ${remainingBrands}`);
    console.log(`   Products: ${remainingProducts}`);
  } catch (error) {
    console.error("❌ Error removing test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

removeTestData();
