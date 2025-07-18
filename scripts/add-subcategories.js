#!/usr/bin/env node

/**
 * Add Sample Subcategories for Testing
 * This script creates parent categories and subcategories to test the hierarchical display
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryHierarchy = [
  {
    parent: "Electronics",
    children: ["Phones", "Laptops", "Accessories"],
  },
  {
    parent: "Books",
    children: ["Fiction", "Non-Fiction", "Educational"],
  },
  {
    parent: "Clothing",
    children: ["Men", "Women", "Kids"],
  },
  {
    parent: "Home & Garden",
    children: ["Kitchen", "Bathroom", "Outdoor"],
  },
];

async function createSubcategories() {
  console.log("🏷️ Creating subcategories...\n");

  for (const hierarchy of categoryHierarchy) {
    try {
      // Find or create parent category
      let parentCategory = await prisma.category.findFirst({
        where: { name: hierarchy.parent },
      });

      if (!parentCategory) {
        parentCategory = await prisma.category.create({
          data: {
            name: hierarchy.parent,
            description: `${hierarchy.parent} category`,
            isActive: true,
          },
        });
        console.log(`✅ Created parent category: ${hierarchy.parent}`);
      } else {
        console.log(`📁 Found existing parent category: ${hierarchy.parent}`);
      }

      // Create subcategories
      for (const childName of hierarchy.children) {
        const existingChild = await prisma.category.findFirst({
          where: {
            name: childName,
            parentId: parentCategory.id,
          },
        });

        if (!existingChild) {
          await prisma.category.create({
            data: {
              name: childName,
              description: `${childName} subcategory under ${hierarchy.parent}`,
              parentId: parentCategory.id,
              isActive: true,
            },
          });
          console.log(
            `  ✅ Created subcategory: ${childName} >> ${hierarchy.parent}`
          );
        } else {
          console.log(
            `  📁 Subcategory already exists: ${childName} >> ${hierarchy.parent}`
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Error creating subcategories for ${hierarchy.parent}:`,
        error.message
      );
    }
  }
}

async function displayHierarchy() {
  console.log("\n📊 Category Hierarchy:");

  const parentCategories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  for (const parent of parentCategories) {
    console.log(`\n📁 ${parent.name}`);
    if (parent.children.length > 0) {
      parent.children.forEach((child) => {
        console.log(`  └── ${child.name}`);
      });
    } else {
      console.log(`  └── (No subcategories)`);
    }
  }
}

async function main() {
  console.log("🚀 Setting up Subcategories for Testing");
  console.log("📡 Using Database via Prisma\n");

  try {
    await createSubcategories();
    await displayHierarchy();

    console.log("\n🎉 Subcategories setup complete!");
    console.log("\n🔄 Next Steps:");
    console.log("1. Test the add product form to see hierarchical categories");
    console.log("2. Test the edit product form to see hierarchical categories");
    console.log("3. Check that categories display as 'Parent >> Child'");
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
