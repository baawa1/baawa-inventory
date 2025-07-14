require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

// Common luxury brands to detect
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
  "Louis Vuitton",
  "Fendi",
  "Burberry",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Boss",
  "Daniel Wellington",
  "Diesel",
  "Invicta",
  "Montblanc",
  "Hublot",
  "Panerai",
];

// Function to extract brand from product name
function extractBrandFromName(productName) {
  if (!productName) return null;

  const name = productName.toLowerCase();

  // Check for known brands (case insensitive)
  for (const brand of knownBrands) {
    if (name.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}

// Function to extract and clean category names
function extractCategories(categoryString) {
  if (!categoryString) return [];

  // Split by comma and clean each category
  const categories = categoryString
    .split(",")
    .map((cat) => cat.trim().replace(/"/g, ""))
    .filter((cat) => cat.length > 0 && cat !== '""')
    .map((cat) => {
      // Truncate if too long and clean up
      if (cat.length > 90) {
        cat = cat.substring(0, 87) + "...";
      }
      return cat;
    });

  return categories;
}

// Robust CSV parser that handles multiline content
function parseCSVFile(csvContent) {
  const lines = csvContent.split("\n");
  const records = [];
  let currentRecord = [];
  let currentField = "";
  let inQuotes = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        currentRecord.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }

    // Add newline if we're inside quotes (multiline field)
    if (inQuotes) {
      currentField += "\n";
    } else {
      // End of record
      currentRecord.push(currentField.trim());
      records.push([...currentRecord]);
      currentRecord = [];
      currentField = "";
    }
  }

  return records;
}

// Function to clean all tables and reset sequences
async function cleanTables() {
  console.log("🧹 Cleaning all product-related tables...");

  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});
    await prisma.category.deleteMany({});

    // Reset auto-increment sequences
    await prisma.$executeRaw`ALTER SEQUENCE products_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE brands_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE categories_id_seq RESTART WITH 1`;

    console.log("✅ All tables cleaned and sequences reset");

    // Verify cleanup
    const productCount = await prisma.product.count();
    const brandCount = await prisma.brand.count();
    const categoryCount = await prisma.category.count();

    console.log(
      `📊 Verification: ${productCount} products, ${brandCount} brands, ${categoryCount} categories`
    );
  } catch (error) {
    console.error("❌ Error cleaning tables:", error);
    throw error;
  }
}

// Function to perform fresh import
async function freshImport(csvFilePath) {
  try {
    console.log("📥 Starting fresh import from WooCommerce CSV...");

    const csvContent = fs.readFileSync(csvFilePath, "utf-8");
    const records = parseCSVFile(csvContent);

    if (records.length === 0) {
      console.log("No records found in CSV");
      return;
    }

    const headers = records[0].map((h) => h.replace(/"/g, ""));
    console.log(`Found ${headers.length} headers`);

    // Find important column indices
    const nameIndex = headers.indexOf("Name");
    const skuIndex = headers.indexOf("SKU");
    const descriptionIndex = headers.indexOf("Description");
    const shortDescIndex = headers.indexOf("Short description");
    const priceIndex = headers.indexOf("Regular price");
    const salePriceIndex = headers.indexOf("Sale price");
    const stockIndex = headers.indexOf("Stock");
    const categoryIndex = headers.indexOf("Categories");
    const tagsIndex = headers.indexOf("Tags");
    const imagesIndex = headers.indexOf("Images");
    const weightIndex = headers.indexOf("Weight (kg)");
    const inStockIndex = headers.indexOf("In stock?");

    console.log("Column indices:");
    console.log(`- Name: ${nameIndex}`);
    console.log(`- SKU: ${skuIndex}`);
    console.log(`- Categories: ${categoryIndex}`);
    console.log(`- Price: ${priceIndex}`);
    console.log(`- Stock: ${stockIndex}`);

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const brandMap = new Map();
    const categoryMap = new Map();

    // Process each product record (skip header)
    for (let i = 1; i < records.length; i++) {
      const record = records[i];

      if (record.length < 10) {
        skippedCount++;
        continue;
      }

      const sku = record[skuIndex]?.replace(/"/g, "").trim();
      const name = record[nameIndex]?.replace(/"/g, "").trim();

      if (!sku || !name || name === "visible") {
        skippedCount++;
        continue;
      }

      console.log(`Processing: ${sku} - ${name.substring(0, 50)}...`);

      try {
        // Extract and process data
        const description =
          record[descriptionIndex]?.replace(/"/g, "").trim() || null;
        const shortDescription =
          record[shortDescIndex]?.replace(/"/g, "").trim() || null;
        const priceStr = record[priceIndex]?.replace(/"/g, "").trim();
        const salePriceStr = record[salePriceIndex]?.replace(/"/g, "").trim();
        const stockStr = record[stockIndex]?.replace(/"/g, "").trim();
        const categoryStr = record[categoryIndex]?.replace(/"/g, "").trim();
        const tagsStr = record[tagsIndex]?.replace(/"/g, "").trim();
        const imagesStr = record[imagesIndex]?.replace(/"/g, "").trim();
        const weightStr = record[weightIndex]?.replace(/"/g, "").trim();
        const inStockStr = record[inStockIndex]?.replace(/"/g, "").trim();

        // Parse numeric values
        const price =
          priceStr && !isNaN(parseFloat(priceStr))
            ? parseFloat(priceStr)
            : 100.0;
        const salePrice =
          salePriceStr && !isNaN(parseFloat(salePriceStr))
            ? parseFloat(salePriceStr)
            : null;
        const stock =
          stockStr && !isNaN(parseInt(stockStr)) ? parseInt(stockStr) : 0;
        const weight =
          weightStr && !isNaN(parseFloat(weightStr))
            ? parseFloat(weightStr)
            : null;
        const inStock =
          inStockStr === "1" || inStockStr?.toLowerCase() === "true";

        // Extract brand from name
        const brandName = extractBrandFromName(name);
        let brandId = null;

        if (brandName) {
          if (!brandMap.has(brandName)) {
            const brand = await prisma.brand.create({
              data: {
                name: brandName,
                isActive: true,
              },
            });
            brandMap.set(brandName, brand.id);
          }
          brandId = brandMap.get(brandName);
        }

        // Extract and create categories
        const categories = extractCategories(categoryStr);
        let categoryId = null;

        if (categories.length > 0) {
          const primaryCategory = categories[0]; // Use first category as primary

          if (!categoryMap.has(primaryCategory)) {
            const category = await prisma.category.create({
              data: {
                name: primaryCategory,
                isActive: true,
              },
            });
            categoryMap.set(primaryCategory, category.id);
          }
          categoryId = categoryMap.get(primaryCategory);
        }

        // Parse tags
        const tags = tagsStr
          ? tagsStr
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : [];

        // Parse images
        const images = imagesStr
          ? imagesStr
              .split(",")
              .map((img) => img.trim())
              .filter((img) => img.length > 0)
          : [];

        // Create product
        const productData = {
          name: name,
          description: description,
          sku: sku,
          price: price,
          salePrice: salePrice,
          cost: price * 0.7, // Assume 30% markup
          stock: stock,
          minStock: stock > 0 ? Math.max(1, Math.floor(stock * 0.1)) : 0,
          unit: "piece",
          weight: weight,
          status: inStock ? "active" : "inactive",
          images: images,
          tags: tags,
          metaTitle: name,
          metaDescription: shortDescription || description?.substring(0, 160),
          isArchived: false,
          isFeatured: false,
        };

        // Add brand relationship if exists
        if (brandId) {
          productData.brand = {
            connect: { id: brandId },
          };
        }

        // Add category relationship if exists
        if (categoryId) {
          productData.category = {
            connect: { id: categoryId },
          };
        }

        await prisma.product.create({
          data: productData,
        });

        importedCount++;

        if (importedCount % 50 === 0) {
          console.log(`  ✅ Imported ${importedCount} products so far...`);
        }
      } catch (error) {
        console.error(`  ❌ Error importing ${sku}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Fresh import complete!`);
    console.log(`- ${importedCount} products imported`);
    console.log(`- ${skippedCount} products skipped`);
    console.log(`- ${errorCount} errors`);
    console.log(`- ${brandMap.size} brands created`);
    console.log(`- ${categoryMap.size} categories created`);

    console.log("\n=== Brand Summary ===");
    const brandCounts = new Map();
    for (const [brandName, _id] of brandMap) {
      const count = await prisma.product.count({
        where: { brand: { name: brandName } },
      });
      brandCounts.set(brandName, count);
    }

    const sortedBrands = Array.from(brandCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    sortedBrands.forEach(([brand, count]) => {
      console.log(`- ${brand}: ${count} products`);
    });

    console.log("\n=== Category Summary ===");
    const categoryCounts = new Map();
    for (const [categoryName, _id] of categoryMap) {
      const count = await prisma.product.count({
        where: { category: { name: categoryName } },
      });
      categoryCounts.set(categoryName, count);
    }

    const sortedCategories = Array.from(categoryCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    sortedCategories.slice(0, 10).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} products`);
    });
  } catch (error) {
    console.error("Error during fresh import:", error);
  }
}

// Main function
async function cleanAndReimport(csvFilePath) {
  try {
    await cleanTables();
    await freshImport(csvFilePath);
  } catch (error) {
    console.error("Error in clean and reimport:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (process.argv[2]) {
  cleanAndReimport(process.argv[2]);
} else {
  console.log("Usage: node clean-and-reimport.js <csv-file>");
}
