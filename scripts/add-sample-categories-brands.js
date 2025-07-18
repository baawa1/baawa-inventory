const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log("📝 Adding sample categories and brands...");

    // Add sample categories
    const categories = [
      {
        name: "Electronics",
        description: "Electronic devices and accessories",
        image:
          "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
      },
      {
        name: "Clothing",
        description: "Apparel and fashion items",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      },
      {
        name: "Home & Garden",
        description: "Home improvement and garden supplies",
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment and outdoor gear",
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      },
      {
        name: "Books & Media",
        description: "Books, movies, and media content",
        image:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      },
    ];

    for (const category of categories) {
      const created = await prisma.category.create({
        data: category,
      });
      console.log(`✅ Created category: ${created.name}`);
    }

    // Add sample brands
    const brands = [
      {
        name: "TechCorp",
        description: "Leading technology company",
        website: "https://techcorp.com",
        image:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
      },
      {
        name: "FashionStyle",
        description: "Premium fashion brand",
        website: "https://fashionstyle.com",
        image:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      },
      {
        name: "HomePro",
        description: "Professional home improvement",
        website: "https://homepro.com",
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      },
      {
        name: "SportMax",
        description: "High-performance sports equipment",
        website: "https://sportmax.com",
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      },
      {
        name: "MediaWorld",
        description: "Entertainment and media content",
        website: "https://mediaworld.com",
        image:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      },
    ];

    for (const brand of brands) {
      const created = await prisma.brand.create({
        data: brand,
      });
      console.log(`✅ Created brand: ${created.name}`);
    }

    console.log("🎉 Sample data added successfully!");
    console.log("📊 Summary:");
    console.log(`   Categories: ${await prisma.category.count()}`);
    console.log(`   Brands: ${await prisma.brand.count()}`);
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();
