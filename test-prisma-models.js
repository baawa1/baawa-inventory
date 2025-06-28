import { prisma } from "@/lib/db";

async function testPrismaModels() {
  try {
    // Test if models exist
    console.log("Testing Prisma models...");

    // List all available properties on prisma
    const properties = Object.getOwnPropertyNames(prisma);
    console.log(
      "Prisma properties:",
      properties.filter((p) => !p.startsWith("$") && !p.startsWith("_"))
    );

    // Try to access models (this should work if they exist)
    const models = [
      "user",
      "product",
      "supplier",
      "stockAddition",
      "StockAddition",
      "stockReconciliation",
      "StockReconciliation",
    ];

    for (const model of models) {
      if (model in prisma) {
        console.log(`✓ ${model} exists`);
      } else {
        console.log(`✗ ${model} does not exist`);
      }
    }
  } catch (error) {
    console.error("Error testing Prisma models:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaModels();
