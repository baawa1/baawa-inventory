const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addSampleCategoriesWithSubcategories() {
  try {
    console.log("Adding sample categories with subcategories...");

    // Create top-level categories
    const electronics = await prisma.category.create({
      data: {
        name: "Electronics",
        description: "Electronic devices and accessories",
        isActive: true,
      },
    });

    const clothing = await prisma.category.create({
      data: {
        name: "Clothing",
        description: "Apparel and fashion items",
        isActive: true,
      },
    });

    const books = await prisma.category.create({
      data: {
        name: "Books",
        description: "Books and publications",
        isActive: true,
      },
    });

    const homeGarden = await prisma.category.create({
      data: {
        name: "Home & Garden",
        description: "Home improvement and garden supplies",
        isActive: true,
      },
    });

    console.log("Created top-level categories:", {
      electronics: electronics.id,
      clothing: clothing.id,
      books: books.id,
      homeGarden: homeGarden.id,
    });

    // Create subcategories for Electronics
    const electronicsSubcategories = await Promise.all([
      prisma.category.create({
        data: {
          name: "Smartphones",
          description: "Mobile phones and accessories",
          isActive: true,
          parentId: electronics.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Laptops",
          description: "Portable computers and accessories",
          isActive: true,
          parentId: electronics.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Audio",
          description: "Headphones, speakers, and audio equipment",
          isActive: true,
          parentId: electronics.id,
        },
      }),
    ]);

    // Create subcategories for Clothing
    const clothingSubcategories = await Promise.all([
      prisma.category.create({
        data: {
          name: "Men's Clothing",
          description: "Clothing for men",
          isActive: true,
          parentId: clothing.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Women's Clothing",
          description: "Clothing for women",
          isActive: true,
          parentId: clothing.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Kids' Clothing",
          description: "Clothing for children",
          isActive: true,
          parentId: clothing.id,
        },
      }),
    ]);

    // Create subcategories for Books
    const booksSubcategories = await Promise.all([
      prisma.category.create({
        data: {
          name: "Fiction",
          description: "Fictional literature",
          isActive: true,
          parentId: books.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Non-Fiction",
          description: "Non-fictional books and educational materials",
          isActive: true,
          parentId: books.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Academic",
          description: "Textbooks and academic publications",
          isActive: true,
          parentId: books.id,
        },
      }),
    ]);

    // Create subcategories for Home & Garden
    const homeGardenSubcategories = await Promise.all([
      prisma.category.create({
        data: {
          name: "Kitchen & Dining",
          description: "Kitchen appliances and dining accessories",
          isActive: true,
          parentId: homeGarden.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Garden Tools",
          description: "Tools and equipment for gardening",
          isActive: true,
          parentId: homeGarden.id,
        },
      }),
      prisma.category.create({
        data: {
          name: "Furniture",
          description: "Home and office furniture",
          isActive: true,
          parentId: homeGarden.id,
        },
      }),
    ]);

    console.log("Created subcategories:");
    console.log(
      "- Electronics subcategories:",
      electronicsSubcategories.length
    );
    console.log("- Clothing subcategories:", clothingSubcategories.length);
    console.log("- Books subcategories:", booksSubcategories.length);
    console.log(
      "- Home & Garden subcategories:",
      homeGardenSubcategories.length
    );

    // Create some nested subcategories (sub-subcategories)
    const smartphoneSubcategories = await Promise.all([
      prisma.category.create({
        data: {
          name: "iPhone",
          description: "Apple iPhone devices",
          isActive: true,
          parentId: electronicsSubcategories[0].id, // Smartphones
        },
      }),
      prisma.category.create({
        data: {
          name: "Android",
          description: "Android smartphones",
          isActive: true,
          parentId: electronicsSubcategories[0].id, // Smartphones
        },
      }),
    ]);

    console.log(
      "Created nested subcategories (sub-subcategories):",
      smartphoneSubcategories.length
    );

    console.log("✅ Sample categories with subcategories added successfully!");
    console.log("\nCategory structure:");
    console.log("- Electronics");
    console.log("  - Smartphones");
    console.log("    - iPhone");
    console.log("    - Android");
    console.log("  - Laptops");
    console.log("  - Audio");
    console.log("- Clothing");
    console.log("  - Men's Clothing");
    console.log("  - Women's Clothing");
    console.log("  - Kids' Clothing");
    console.log("- Books");
    console.log("  - Fiction");
    console.log("  - Non-Fiction");
    console.log("  - Academic");
    console.log("- Home & Garden");
    console.log("  - Kitchen & Dining");
    console.log("  - Garden Tools");
    console.log("  - Furniture");
  } catch (error) {
    console.error("Error adding sample categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleCategoriesWithSubcategories();
