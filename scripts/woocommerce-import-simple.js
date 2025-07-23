require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

// Helper function to parse WooCommerce categories
function parseCategories(categoryString) {
  if (!categoryString) return null;

  // Split by comma and get the first category (primary)
  const categories = categoryString.split(",").map((cat) => cat.trim());
  const primaryCategory = categories[0]; // Return primary category

  // Truncate if too long (max 100 characters for database field)
  if (primaryCategory && primaryCategory.length > 100) {
    return primaryCategory.substring(0, 97) + "...";
  }

  return primaryCategory;
}

// Helper function to parse WooCommerce tags
function parseTags(tagString) {
  if (!tagString) return [];

  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// Helper function to parse WooCommerce images
function parseImages(imageString) {
  if (!imageString) return [];

  return imageString
    .split(",")
    .map((img) => img.trim())
    .filter((img) => img.length > 0);
}

// Helper function to parse variant attributes
function parseVariantAttributes(
  attr1Name,
  attr1Values,
  attr2Name,
  attr2Values
) {
  const attributes = {};

  if (attr1Name && attr1Values) {
    attributes[attr1Name] = attr1Values.split(",").map((val) => val.trim());
  }

  if (attr2Name && attr2Values) {
    attributes[attr2Name] = attr2Values.split(",").map((val) => val.trim());
  }

  return Object.keys(attributes).length > 0 ? attributes : null;
}

// Main import function
async function importWooCommerceProducts(csvFilePath) {
  try {
    console.log("Starting WooCommerce import (simplified version)...");

    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each product
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        // Parse CSV line (handle commas in quoted fields)
        const values = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        // Create product object
        const product = {};
        headers.forEach((header, index) => {
          product[header] = values[index] || "";
        });

        // Skip if no SKU or name
        if (!product.SKU || !product.Name) {
          skippedCount++;
          continue;
        }

        // Check if product already exists
        const existingProduct = await prisma.product.findUnique({
          where: { sku: product.SKU },
        });

        if (existingProduct) {
          console.log(
            `Product with SKU ${product.SKU} already exists, skipping...`
          );
          skippedCount++;
          continue;
        }

        // Find or create brand
        let brandId = null;
        if (product.Brands) {
          const brand = await prisma.brand.upsert({
            where: { name: product.Brands },
            update: {},
            create: {
              name: product.Brands,
              isActive: true,
            },
          });
          brandId = brand.id;
        }

        // Find or create category
        let categoryId = null;
        if (product.Categories) {
          const primaryCategory = parseCategories(product.Categories);
          if (primaryCategory) {
            const category = await prisma.category.upsert({
              where: { name: primaryCategory },
              update: {},
              create: {
                name: primaryCategory,
                isActive: true,
              },
            });
            categoryId = category.id;
          }
        }

        // Process images (keep original URLs for now)
        let imageUrls = [];
        if (product.Images) {
          imageUrls = parseImages(product.Images);
          console.log(`Found ${imageUrls.length} images for ${product.SKU}`);
        }

        // Parse variant attributes
        const variantAttributes = parseVariantAttributes(
          product["Attribute 1 name"],
          product["Attribute 1 value(s)"],
          product["Attribute 2 name"],
          product["Attribute 2 value(s)"]
        );

        // Create product in database
        const _newProduct = await prisma.product.create({
          data: {
            name: product.Name,
            description:
              product.Description || product["Short description"] || "",
            sku: product.SKU,
            barcode: product.SKU, // Use SKU as barcode if no specific barcode
            cost: parseFloat(product["Meta: _wc_cog_cost"]) || 0,
            price: parseFloat(product["Regular price"]) || 0,
            salePrice: product["Sale price"]
              ? parseFloat(product["Sale price"])
              : null,
            saleStartDate: product["Date sale price starts"]
              ? new Date(product["Date sale price starts"])
              : null,
            saleEndDate: product["Date sale price ends"]
              ? new Date(product["Date sale price ends"])
              : null,
            stock: parseInt(product.Stock) || 0,
            minStock: parseInt(product["Low stock amount"]) || 0,
            weight: product["Weight (kg)"]
              ? parseFloat(product["Weight (kg)"])
              : null,
            dimensions:
              product["Length (cm)"] &&
              product["Width (cm)"] &&
              product["Height (cm)"]
                ? `${product["Length (cm)"]}x${product["Width (cm)"]}x${product["Height (cm)"]}cm`
                : null,
            status: product.Published === "1" ? "active" : "inactive",
            isFeatured: product["Is featured?"] === "1",

            sortOrder: product.Position ? parseInt(product.Position) : null,
            images: imageUrls,
            tags: parseTags(product.Tags),
            metaTitle: product["Meta: post_title"] || product.Name,
            metaDescription:
              product["Meta: post_excerpt"] ||
              product["Short description"] ||
              "",
            metaExcerpt: product["Meta: post_excerpt"] || "",
            metaContent:
              product["Meta: post_content"] || product.Description || "",
            seoKeywords: parseTags(product.Tags),
            variantAttributes: variantAttributes,
            variantValues: variantAttributes,
            brandId: brandId,
            categoryId: categoryId,
          },
        });

        console.log(`✅ Imported: ${product.Name} (SKU: ${product.SKU})`);
        importedCount++;

        // Add delay to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`❌ Error importing product on line ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`✅ Successfully imported: ${importedCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log(
      "\n📝 Note: Images are stored as original URLs. You can migrate them to Supabase storage later."
    );
  } catch (error) {
    console.error("Import failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import if called directly
if (require.main === module) {
  const csvFile = process.argv[2];

  if (!csvFile) {
    console.error("Usage: node woocommerce-import-simple.js <csv-file-path>");
    process.exit(1);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  importWooCommerceProducts(csvFile);
}

module.exports = { importWooCommerceProducts };
