const { PrismaClient } = require("@prisma/client");

async function testConnection() {
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

  try {
    console.log("🔄 Testing database connection...");

    // Test connection
    await prisma.$executeRaw`SELECT 1`;
    console.log("✅ Database connection successful");

    // Test product count
    const productCount = await prisma.product.count();
    console.log(`📊 Found ${productCount} products in database`);

    // Test product retrieval
    const products = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
      },
    });

    console.log("📦 Sample products:");
    products.forEach((product) => {
      console.log(`  - ${product.name} (${product.sku}): $${product.price}`);
    });
  } catch (error) {
    console.error("❌ Connection test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
