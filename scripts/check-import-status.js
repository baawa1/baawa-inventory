require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkStatus() {
  try {
    console.log("=== IMPORT STATUS CHECK ===");

    const productCount = await prisma.product.count();
    const brandCount = await prisma.brand.count();
    const categoryCount = await prisma.category.count();

    console.log(`📊 Current Counts:`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Brands: ${brandCount}`);
    console.log(`   Categories: ${categoryCount}`);

    if (productCount > 0) {
      console.log("\n📝 Sample Products:");
      const samples = await prisma.product.findMany({
        take: 5,
        include: {
          brand: true,
          category: true,
        },
      });

      samples.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku}`);
        console.log(`   Brand: ${product.brand?.name || "None"}`);
        console.log(`   Category: ${product.category?.name || "None"}`);
        console.log(`   Price: ₦${product.price}`);
        console.log("");
      });
    }

    if (brandCount > 0) {
      console.log("\n🏷️  Top Brands:");
      const brands = await prisma.brand.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          products: {
            _count: "desc",
          },
        },
        take: 10,
      });

      brands.forEach((brand) => {
        console.log(`   ${brand.name}: ${brand._count.products} products`);
      });
    }

    if (categoryCount > 0) {
      console.log("\n📂 Top Categories:");
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          products: {
            _count: "desc",
          },
        },
        take: 10,
      });

      categories.forEach((category) => {
        console.log(
          `   ${category.name}: ${category._count.products} products`
        );
      });
    }
  } catch (error) {
    console.error("Error checking status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
