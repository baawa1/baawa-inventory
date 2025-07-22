const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateProductStatuses() {
  try {
    console.log("Starting product status update...");

    // Update active products
    const activeResult = await prisma.product.updateMany({
      where: { status: "active" },
      data: { status: "ACTIVE" },
    });
    console.log(
      `Updated ${activeResult.count} products from 'active' to 'ACTIVE'`
    );

    // Update inactive products
    const inactiveResult = await prisma.product.updateMany({
      where: { status: "inactive" },
      data: { status: "INACTIVE" },
    });
    console.log(
      `Updated ${inactiveResult.count} products from 'inactive' to 'INACTIVE'`
    );

    // Update discontinued products
    const discontinuedResult = await prisma.product.updateMany({
      where: { status: "discontinued" },
      data: { status: "DISCONTINUED" },
    });
    console.log(
      `Updated ${discontinuedResult.count} products from 'discontinued' to 'DISCONTINUED'`
    );

    const totalUpdated =
      activeResult.count + inactiveResult.count + discontinuedResult.count;
    console.log(`Total products updated: ${totalUpdated}`);

    // Verify the update
    const activeProducts = await prisma.product.count({
      where: { status: "ACTIVE" },
    });

    const inactiveProducts = await prisma.product.count({
      where: { status: "INACTIVE" },
    });

    const discontinuedProducts = await prisma.product.count({
      where: { status: "DISCONTINUED" },
    });

    console.log("Status distribution after update:");
    console.log(`- ACTIVE: ${activeProducts}`);
    console.log(`- INACTIVE: ${inactiveProducts}`);
    console.log(`- DISCONTINUED: ${discontinuedProducts}`);

    // Check for any remaining lowercase values
    const remainingLowercase = await prisma.product.findMany({
      where: {
        status: {
          in: ["active", "inactive", "discontinued"],
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (remainingLowercase.length > 0) {
      console.log("Warning: Found products with lowercase status values:");
      remainingLowercase.forEach((product) => {
        console.log(
          `- ID: ${product.id}, Name: ${product.name}, Status: ${product.status}`
        );
      });
    } else {
      console.log(
        "✅ All product statuses have been successfully updated to uppercase!"
      );
    }
  } catch (error) {
    console.error("Error updating product statuses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateProductStatuses();
