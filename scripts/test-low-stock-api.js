const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testLowStockFilter() {
  try {
    console.log("🧪 Testing low stock filter logic...\n");

    // Simulate the low stock filter logic from the API
    const allProducts = await prisma.product.findMany({
      where: {
        isArchived: false,
      },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: [{ stock: "asc" }, { name: "asc" }],
    });

    console.log(`Total products: ${allProducts.length}`);

    // Apply low stock filter
    const lowStockProducts = allProducts.filter(
      (product) => product.stock <= (product.minStock || 0)
    );

    console.log(`Low stock products found: ${lowStockProducts.length}\n`);

    if (lowStockProducts.length === 0) {
      console.log(
        "❌ No low stock products found. This might indicate an issue."
      );
      return;
    }

    console.log("📋 First 5 low stock products:");
    console.log("─".repeat(80));

    lowStockProducts.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.sku})`);
      console.log(`   Stock: ${product.stock}/${product.minStock}`);
      console.log(`   Category: ${product.category?.name || "None"}`);
      console.log(`   Brand: ${product.brand?.name || "None"}`);
      console.log("");
    });

    // Test pagination
    const page = 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = lowStockProducts.slice(
      startIndex,
      startIndex + limit
    );

    console.log(`📄 Pagination test (page ${page}, limit ${limit}):`);
    console.log(`- Start index: ${startIndex}`);
    console.log(`- Products returned: ${paginatedProducts.length}`);
    console.log(`- Total low stock products: ${lowStockProducts.length}`);

    console.log("\n✅ Low stock filter logic appears to be working correctly.");
  } catch (error) {
    console.error("❌ Error testing low stock filter:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLowStockFilter();
