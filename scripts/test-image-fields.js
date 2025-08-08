const { PrismaClient } = require("@prisma/client");
const logger = require("./script-logger");

const prisma = new PrismaClient();

async function testImageFields() {
  try {
    logger.info("🧪 Testing database fields...");

    // Test creating a category
    const testCategory = await prisma.category.create({
      data: {
        name: "Test Category",
        description: "Testing field functionality",
      },
    });

    logger.info("✅ Created category:", {
      id: testCategory.id,
      name: testCategory.name,
    });

    // Test creating a brand
    const testBrand = await prisma.brand.create({
      data: {
        name: "Test Brand",
        description: "Testing field functionality",
        website: "https://testbrand.com",
      },
    });

    logger.info("✅ Created brand:", {
      id: testBrand.id,
      name: testBrand.name,
    });

    // Test updating fields
    const updatedCategory = await prisma.category.update({
      where: { id: testCategory.id },
      data: { description: "Updated description" },
    });

    logger.info("✅ Updated category:", {
      id: updatedCategory.id,
      description: updatedCategory.description,
    });

    const updatedBrand = await prisma.brand.update({
      where: { id: testBrand.id },
      data: { description: "Updated description" },
    });

    logger.info("✅ Updated brand:", {
      id: updatedBrand.id,
      description: updatedBrand.description,
    });

  

    // Clean up test data
    await prisma.category.delete({ where: { id: testCategory.id } });
    await prisma.brand.delete({ where: { id: testBrand.id } });

    logger.info("🧹 Cleaned up test data");
    logger.info("🎉 Database fields are working correctly!");
  } catch (error) {
    logger.error("❌ Error testing database fields:", { error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

testImageFields();
