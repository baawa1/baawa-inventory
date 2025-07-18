#!/usr/bin/env node

/**
 * Test Hierarchical Categories
 * Verify that subcategories are working correctly
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testHierarchicalCategories() {
  console.log("🔍 Testing Hierarchical Categories...\n");

  try {
    // Test 1: Get all categories with hierarchy
    console.log("📋 Test 1: All Categories with Hierarchy");
    const allCategories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });

    console.log(`Found ${allCategories.length} categories:\n`);

    allCategories.forEach((category) => {
      if (category.parent) {
        console.log(`  ${category.parent.name} >> ${category.name}`);
      } else {
        console.log(`  ${category.name} (Parent)`);
      }
    });

    // Test 2: Get parent categories only
    console.log("\n📁 Test 2: Parent Categories Only");
    const parentCategories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${parentCategories.length} parent categories:\n`);

    parentCategories.forEach((parent) => {
      console.log(`📁 ${parent.name}`);
      if (parent.children.length > 0) {
        parent.children.forEach((child) => {
          console.log(`  └── ${child.name}`);
        });
      } else {
        console.log(`  └── (No subcategories)`);
      }
    });

    // Test 3: Get subcategories only
    console.log("\n📂 Test 3: Subcategories Only");
    const subcategories = await prisma.category.findMany({
      where: { parentId: { not: null } },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${subcategories.length} subcategories:\n`);

    subcategories.forEach((subcategory) => {
      console.log(`  ${subcategory.parent.name} >> ${subcategory.name}`);
    });

    // Test 4: Check products with categories
    console.log("\n📦 Test 4: Products with Categories");
    const productsWithCategories = await prisma.product.findMany({
      include: {
        category: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: 5,
      orderBy: { name: "asc" },
    });

    console.log(
      `Found ${productsWithCategories.length} products with categories:\n`
    );

    productsWithCategories.forEach((product) => {
      if (product.category) {
        if (product.category.parent) {
          console.log(
            `  ${product.name}: ${product.category.parent.name} >> ${product.category.name}`
          );
        } else {
          console.log(`  ${product.name}: ${product.category.name}`);
        }
      } else {
        console.log(`  ${product.name}: No category`);
      }
    });

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Error testing hierarchical categories:", error);
  }
}

async function main() {
  console.log("🚀 Testing Hierarchical Categories Implementation");
  console.log("📡 Using Database via Prisma\n");

  try {
    await testHierarchicalCategories();
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
