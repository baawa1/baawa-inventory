const { PrismaClient } = require("@prisma/client");
const logger = require("./script-logger");

const prisma = new PrismaClient();

async function addSampleData() {
  try {
    logger.info("📝 Adding sample categories and brands...");

    // Add sample categories
    const categories = [
      {
        name: "Electronics",
        description: "Electronic devices and accessories",
      },
      {
        name: "Clothing",
        description: "Apparel and fashion items",
      },
      {
        name: "Home & Garden",
        description: "Home improvement and garden supplies",
      },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment and outdoor gear",
      },
      {
        name: "Books & Media",
        description: "Books, movies, and media content",
      },
    ];

    for (const category of categories) {
      const created = await prisma.category.create({
        data: category,
      });
      logger.info(`✅ Created category: ${created.name}`);
    }

    // Add sample brands
    const brands = [
      {
        name: "TechCorp",
        description: "Leading technology company",
        website: "https://techcorp.com",
      },
      {
        name: "FashionStyle",
        description: "Premium fashion brand",
        website: "https://fashionstyle.com",
      },
      {
        name: "HomePro",
        description: "Professional home improvement",
        website: "https://homepro.com",
      },
      {
        name: "SportMax",
        description: "High-performance sports equipment",
        website: "https://sportmax.com",
      },
      {
        name: "MediaWorld",
        description: "Entertainment and media content",
        website: "https://mediaworld.com",
      },
    ];

    for (const brand of brands) {
      const created = await prisma.brand.create({
        data: brand,
      });
      logger.info(`✅ Created brand: ${created.name}`);
    }

    logger.info("🎉 Sample data added successfully!");
    logger.info("📊 Summary:", {
      categories: await prisma.category.count(),
      brands: await prisma.brand.count()
    });
  } catch (error) {
    logger.error("❌ Error adding sample data:", { error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();
