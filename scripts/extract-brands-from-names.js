require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Common luxury watch brands and other brand patterns
const knownBrands = [
  "Audemars Piguet",
  "Rolex",
  "Patek Philippe",
  "Omega",
  "Cartier",
  "TAG Heuer",
  "Breitling",
  "IWC",
  "Jaeger-LeCoultre",
  "Vacheron Constantin",
  "Tudor",
  "Longines",
  "Tissot",
  "Seiko",
  "Citizen",
  "Casio",
  "Fossil",
  "Michael Kors",
  "Armani",
  "Hugo Boss",
  "Versace",
  "Gucci",
  "Prada",
  "Bulgari",
  "Bvlgari",
  "Chanel",
  "Dior",
  "Hermes",
  "Apple",
  "Samsung",
  "Huawei",
  "Sony",
  "Nike",
  "Adidas",
  "Puma",
  "Under Armour",
];

// Function to extract brand from product name
function extractBrandFromName(productName) {
  if (!productName) return null;

  const name = productName.toLowerCase();

  // Check for known brands
  for (const brand of knownBrands) {
    if (name.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  // Try to extract first word if it might be a brand
  const words = productName.trim().split(" ");
  const firstWord = words[0];

  // If first word is capitalized and not a common word, might be a brand
  if (
    firstWord &&
    firstWord[0] === firstWord[0].toUpperCase() &&
    firstWord.length > 2
  ) {
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "up",
      "about",
      "into",
      "over",
      "after",
    ];
    if (!commonWords.includes(firstWord.toLowerCase())) {
      return firstWord;
    }
  }

  return null;
}

// Function to extract and import brands from existing products
async function extractBrandsFromProducts() {
  try {
    console.log("Extracting brands from existing product names...");

    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brandId: true,
      },
    });

    console.log(`Found ${products.length} products to analyze...`);

    const brandCounts = new Map();
    const productBrands = new Map();

    // Analyze each product
    for (const product of products) {
      const brand = extractBrandFromName(product.name);
      if (brand) {
        brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
        productBrands.set(product.id, brand);
      }
    }

    console.log("\n=== Brand Analysis ===");
    console.log(`Extracted ${brandCounts.size} unique brands:`);

    const sortedBrands = Array.from(brandCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    sortedBrands.forEach(([brand, count]) => {
      console.log(`- ${brand}: ${count} products`);
    });

    // Create brands in database
    console.log("\n=== Importing Brands ===");
    let importedCount = 0;
    let updatedProducts = 0;

    for (const [brandName] of sortedBrands) {
      try {
        const brand = await prisma.brand.upsert({
          where: { name: brandName },
          update: {},
          create: {
            name: brandName,
            isActive: true,
          },
        });

        console.log(`✅ Brand created/updated: ${brand.name}`);
        importedCount++;

        // Update products with this brand
        const productsToUpdate = products.filter(
          (p) => productBrands.get(p.id) === brandName
        );

        for (const product of productsToUpdate) {
          await prisma.product.update({
            where: { id: product.id },
            data: { brandId: brand.id },
          });
          updatedProducts++;
        }
      } catch (error) {
        console.error(
          `❌ Error importing brand "${brandName}":`,
          error.message
        );
      }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`- ${importedCount} brands imported`);
    console.log(
      `- ${updatedProducts} products updated with brand associations`
    );
  } catch (error) {
    console.error("Error extracting brands:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
extractBrandsFromProducts();
