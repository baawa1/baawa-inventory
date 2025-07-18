const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testImageFields() {
  try {
    console.log("🧪 Testing image fields in database...");

    // Test creating a category with image
    const testCategory = await prisma.category.create({
      data: {
        name: "Test Category with Image",
        description: "Testing image field functionality",
        image: "https://example.com/test-category-image.jpg",
      },
    });

    console.log("✅ Created category with image:", {
      id: testCategory.id,
      name: testCategory.name,
      image: testCategory.image,
    });

    // Test creating a brand with image
    const testBrand = await prisma.brand.create({
      data: {
        name: "Test Brand with Image",
        description: "Testing image field functionality",
        website: "https://testbrand.com",
        image: "https://example.com/test-brand-image.jpg",
      },
    });

    console.log("✅ Created brand with image:", {
      id: testBrand.id,
      name: testBrand.name,
      image: testBrand.image,
    });

    // Test updating image fields
    const updatedCategory = await prisma.category.update({
      where: { id: testCategory.id },
      data: { image: "https://example.com/updated-category-image.jpg" },
    });

    console.log("✅ Updated category image:", updatedCategory.image);

    const updatedBrand = await prisma.brand.update({
      where: { id: testBrand.id },
      data: { image: "https://example.com/updated-brand-image.jpg" },
    });

    console.log("✅ Updated brand image:", updatedBrand.image);

    // Clean up test data
    await prisma.category.delete({ where: { id: testCategory.id } });
    await prisma.brand.delete({ where: { id: testBrand.id } });

    console.log("🧹 Cleaned up test data");
    console.log("🎉 Image fields are working correctly!");
  } catch (error) {
    console.error("❌ Error testing image fields:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testImageFields();
