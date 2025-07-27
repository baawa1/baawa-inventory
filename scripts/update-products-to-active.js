const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateProductsToActive() {
  try {
    console.log("Updating all products to ACTIVE status...");

    const result = await prisma.product.updateMany({
      where: {
        // Update products that are not already ACTIVE
        status: {
          not: "ACTIVE",
        },
      },
      data: {
        status: "ACTIVE",
      },
    });

    console.log(`Updated ${result.count} products to ACTIVE status`);

    // Count total products
    const totalProducts = await prisma.product.count();
    console.log(`Total products in database: ${totalProducts}`);

    // Count active products
    const activeProducts = await prisma.product.count({
      where: {
        status: "ACTIVE",
      },
    });
    console.log(`Active products: ${activeProducts}`);
  } catch (error) {
    console.error("Error updating products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductsToActive();
