const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testReportsFix() {
  try {
    console.log("Testing report calculations...\n");

    // Test current stock report calculations
    console.log("=== Current Stock Report ===");
    const allProducts = await prisma.product.findMany({
      where: { isArchived: false },
      select: {
        stock: true,
        minStock: true,
        price: true,
        cost: true,
      },
    });

    const totalProducts = allProducts.length;
    const totalValue = allProducts.reduce(
      (sum, p) => sum + (p.stock || 0) * Number(p.price || 0),
      0
    );
    const lowStockItems = allProducts.filter(
      (p) => (p.stock || 0) <= (p.minStock || 0)
    ).length;
    const outOfStockItems = allProducts.filter(
      (p) => (p.stock || 0) === 0
    ).length;

    console.log(`Total Products: ${totalProducts}`);
    console.log(`Total Stock Value: ₦${totalValue.toLocaleString()}`);
    console.log(`Low Stock Items: ${lowStockItems}`);
    console.log(`Out of Stock Items: ${outOfStockItems}`);

    // Test low stock report calculations
    console.log("\n=== Low Stock Report ===");
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isArchived: false,
        stock: { lte: prisma.product.fields.minStock },
      },
      select: {
        stock: true,
        minStock: true,
        cost: true,
      },
    });

    const totalLowStockItems = lowStockProducts.length;
    const outOfStockFromLowStock = lowStockProducts.filter(
      (p) => (p.stock || 0) === 0
    ).length;
    const totalReorderValue = lowStockProducts.reduce(
      (sum, p) => sum + (p.minStock || 0) * 2 * Number(p.cost || 0),
      0
    );

    console.log(`Total Low Stock Items: ${totalLowStockItems}`);
    console.log(`Out of Stock Items: ${outOfStockFromLowStock}`);
    console.log(`Total Reorder Value: ₦${totalReorderValue.toLocaleString()}`);

    // Test stock value report calculations
    console.log("\n=== Stock Value Report ===");
    const totalStockValue = allProducts.reduce(
      (sum, p) => sum + (p.stock || 0) * Number(p.price || 0),
      0
    );
    const totalCostValue = allProducts.reduce(
      (sum, p) => sum + (p.stock || 0) * Number(p.cost || 0),
      0
    );
    const totalProfit = allProducts.reduce(
      (sum, p) =>
        sum + (p.stock || 0) * (Number(p.price || 0) - Number(p.cost || 0)),
      0
    );

    console.log(`Total Stock Value: ₦${totalStockValue.toLocaleString()}`);
    console.log(`Total Cost Value: ₦${totalCostValue.toLocaleString()}`);
    console.log(`Total Profit: ₦${totalProfit.toLocaleString()}`);

    // Test reorder calculations for a few products
    console.log("\n=== Sample Reorder Calculations ===");
    const sampleLowStock = await prisma.product.findMany({
      where: {
        isArchived: false,
        stock: { lte: prisma.product.fields.minStock },
      },
      select: {
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        cost: true,
      },
      take: 5,
    });

    sampleLowStock.forEach((product) => {
      const reorderQty = (product.minStock || 0) * 2;
      const reorderValue = reorderQty * Number(product.cost || 0);
      console.log(`${product.name} (${product.sku}):`);
      console.log(
        `  Current Stock: ${product.stock || 0}, Min Stock: ${product.minStock || 0}`
      );
      console.log(
        `  Reorder Qty: ${reorderQty}, Reorder Value: ₦${reorderValue.toLocaleString()}`
      );
    });
  } catch (error) {
    console.error("Error testing reports:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testReportsFix();
