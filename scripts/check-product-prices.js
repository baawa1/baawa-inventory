const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkProductPrices() {
  try {
    console.log("Checking product prices and costs...\n");

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        cost: true,
        stock: true,
      },
      take: 10,
    });

    console.log("Sample products with their prices and costs:");
    console.log("ID | Name | SKU | Price | Cost | Stock | Stock Value");
    console.log("---|------|-----|-------|------|-------|------------");

    products.forEach((product) => {
      const stockValue = (product.stock || 0) * Number(product.price || 0);
      console.log(
        `${product.id} | ${product.name} | ${product.sku} | ₦${product.price || 0} | ₦${product.cost || 0} | ${product.stock || 0} | ₦${stockValue}`
      );
    });

    console.log("\nSummary:");
    const totalProducts = await prisma.product.count();
    const productsWithZeroPrice = await prisma.product.count({
      where: { price: 0 },
    });
    const productsWithZeroCost = await prisma.product.count({
      where: { cost: 0 },
    });

    console.log(`Total products: ${totalProducts}`);
    console.log(`Products with zero price: ${productsWithZeroPrice}`);
    console.log(`Products with zero cost: ${productsWithZeroCost}`);
  } catch (error) {
    console.error("Error checking product prices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductPrices();
