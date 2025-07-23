require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables:");
  console.error(
    "   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to download and upload image to Supabase
async function uploadImageToSupabase(imageUrl, productSku) {
  try {
    // Download image from URL
    const imageBuffer = await downloadImage(imageUrl);

    // Generate unique filename
    const urlParts = new URL(imageUrl);
    const originalFilename = path.basename(urlParts.pathname);
    const extension = path.extname(originalFilename);
    const filename = `${productSku}_${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`;

    // Upload to Supabase storage
    const { data: _data, error } = await supabase.storage
      .from("product-images")
      .upload(filename, imageBuffer, {
        contentType: "image/jpeg", // Adjust based on image type
        cacheControl: "3600",
      });

    if (error) {
      console.error(`Error uploading image ${imageUrl}:`, error);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error);
    return null;
  }
}

// Helper function to download image
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

// Helper function to parse WooCommerce categories
function parseCategories(categoryString) {
  if (!categoryString) return null;

  // Split by comma and get the first category (primary)
  const categories = categoryString.split(",").map((cat) => cat.trim());
  return categories[0]; // Return primary category
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
    console.log("Starting WooCommerce import...");

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

        // Process images
        let imageUrls = [];
        if (product.Images) {
          const imageList = parseImages(product.Images);
          console.log(
            `Processing ${imageList.length} images for ${product.SKU}...`
          );

          for (const imageUrl of imageList) {
            const supabaseUrl = await uploadImageToSupabase(
              imageUrl,
              product.SKU
            );
            if (supabaseUrl) {
              imageUrls.push(supabaseUrl);
            }
          }
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
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error importing product on line ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`✅ Successfully imported: ${importedCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
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
    console.error("Usage: node woocommerce-import.js <csv-file-path>");
    process.exit(1);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  importWooCommerceProducts(csvFile);
}

module.exports = { importWooCommerceProducts };
