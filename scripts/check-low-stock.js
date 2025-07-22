const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkLowStockProducts() {
  try {
    console.log("🔍 Checking for low stock products...\n");

    // Get all products
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

    // Filter for low stock products
    const lowStockProducts = allProducts.filter(
      (product) => product.stock === 0 || product.stock <= product.minStock
    );

    console.log(`Low stock products: ${lowStockProducts.length}\n`);

    if (lowStockProducts.length === 0) {
      console.log(
        "✅ No low stock products found. All products have sufficient stock."
      );
      return;
    }

    console.log("📋 Low Stock Products:");
    console.log("─".repeat(80));

    lowStockProducts.forEach((product, index) => {
      const stockStatus =
        product.stock === 0
          ? "OUT OF STOCK"
          : product.stock <= product.minStock * 0.5
            ? "CRITICAL"
            : "LOW";

      console.log(`${index + 1}. ${product.name} (${product.sku})`);
      console.log(
        `   Stock: ${product.stock}/${product.minStock} - ${stockStatus}`
      );
      console.log(`   Category: ${product.category?.name || "None"}`);
      console.log(`   Brand: ${product.brand?.name || "None"}`);
      console.log(`   Supplier: ${product.supplier?.name || "None"}`);
      console.log("");
    });

    // Calculate metrics
    const totalValue = lowStockProducts.reduce(
      (sum, product) => sum + Number(product.stock) * Number(product.cost),
      0
    );

    const criticalStock = lowStockProducts.filter(
      (product) =>
        product.stock === 0 || product.stock <= product.minStock * 0.5
    ).length;

    const lowStock = lowStockProducts.filter(
      (product) => product.stock > 0 && product.stock <= product.minStock
    ).length;

    console.log("📊 Summary:");
    console.log(`- Total low stock products: ${lowStockProducts.length}`);
    console.log(`- Critical stock (0 or ≤50% of min): ${criticalStock}`);
    console.log(`- Low stock (>0 and ≤min): ${lowStock}`);
    console.log(`- Total value: ₦${totalValue.toLocaleString()}`);
  } catch (error) {
    console.error("❌ Error checking low stock products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLowStockProducts();
