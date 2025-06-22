const { PrismaClient } = require("@prisma/client");

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log("Testing database connection...");

    // Test basic queries
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const supplierCount = await prisma.supplier.count();

    console.log("✅ Database connection successful!");
    console.log(`📊 Database Stats:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Suppliers: ${supplierCount}`);

    // Test a more complex query with relations
    const productsWithSuppliers = await prisma.product.findMany({
      include: {
        supplier: true,
        variants: true,
      },
      take: 3,
    });

    console.log("\n📦 Sample Products:");
    productsWithSuppliers.forEach((product) => {
      console.log(`   - ${product.name} (${product.sku})`);
      console.log(`     Supplier: ${product.supplier?.name || "N/A"}`);
      console.log(`     Variants: ${product.variants.length}`);
      console.log(`     Price: $${product.price}`);
    });

    // Test product variants
    const variants = await prisma.productVariant.findMany({
      include: {
        product: true,
      },
      take: 2,
    });

    console.log("\n🎨 Sample Product Variants:");
    variants.forEach((variant) => {
      console.log(`   - ${variant.name} (${variant.sku})`);
      console.log(`     Color: ${variant.color || "N/A"}`);
      console.log(`     Stock: ${variant.currentStock}`);
      console.log(`     Product: ${variant.product.name}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
