const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function restoreImagesFromCSV() {
  try {
    console.log("🔄 Starting image restoration from CSV...");

    // Read the CSV file
    const csvPath = path.join(
      __dirname,
      "..",
      "wc-product-export-18-6-2025-1750220421093.csv"
    );
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV content using a more robust approach
    const lines = csvContent.split("\n");
    const headers = parseCSVLine(lines[0]);

    // Find the relevant column indices
    const idIndex = headers.findIndex((h) => h === "ID");
    const nameIndex = headers.findIndex((h) => h === "Name");
    const skuIndex = headers.findIndex((h) => h === "SKU");
    const brandIndex = headers.findIndex((h) => h === "Brands");
    const categoryIndex = headers.findIndex((h) => h === "Categories");
    const imagesIndex = headers.findIndex((h) => h === "Images");

    console.log("📊 Found columns:", {
      id: idIndex,
      name: nameIndex,
      sku: skuIndex,
      brand: brandIndex,
      category: categoryIndex,
      images: imagesIndex,
    });

    if (idIndex === -1 || nameIndex === -1 || imagesIndex === -1) {
      console.error("❌ Required columns not found in CSV");
      return;
    }

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        // Parse CSV line
        const values = parseCSVLine(line);

        if (values.length < Math.max(idIndex, nameIndex, imagesIndex) + 1) {
          console.log(`⏭️  Skipping line ${i} - insufficient columns`);
          continue;
        }

        const productId = values[idIndex];
        const productName = values[nameIndex] || "";
        const sku = values[skuIndex] || "";
        const brand = values[brandIndex] || "";
        const category = values[categoryIndex] || "";
        const imagesString = values[imagesIndex] || "";

        if (!productId || !imagesString) {
          console.log(`⏭️  Skipping product ${productId} - no images`);
          continue;
        }

        // Parse image URLs
        const imageUrls = imagesString
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url && url.startsWith("http"));

        if (imageUrls.length === 0) {
          console.log(
            `⏭️  Skipping product ${productId} - no valid image URLs`
          );
          continue;
        }

        // Generate meaningful alt text for each image
        const imageObjects = imageUrls.map((url, index) => {
          const altText = generateAltText(
            productName,
            brand,
            category,
            index + 1
          );
          return {
            url,
            altText,
          };
        });

        // Find the product in the database by SKU or name
        let product = await prisma.product.findFirst({
          where: {
            OR: [
              { sku: sku },
              { name: { contains: productName, mode: "insensitive" } },
            ],
          },
        });

        if (!product) {
          console.log(`❌ Product not found: ${productName} (SKU: ${sku})`);
          errorCount++;
          continue;
        }

        // Update the product with the new image format
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: imageObjects,
          },
        });

        console.log(
          `✅ Updated product: ${product.name} with ${imageObjects.length} images`
        );
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error processing line ${i}:`, error.message);
        errorCount++;
      }

      processedCount++;

      // Progress indicator
      if (processedCount % 10 === 0) {
        console.log(`📈 Processed ${processedCount} products...`);
      }
    }

    console.log("\n🎉 Image restoration completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Total processed: ${processedCount}`);
    console.log(`   - Successfully updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
  } catch (error) {
    console.error("❌ Error during image restoration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  values.push(current.trim());

  return values;
}

function generateAltText(productName, brand, category, imageNumber) {
  const cleanName = productName.replace(/[^\w\s]/g, "").trim();
  const cleanBrand = brand.replace(/[^\w\s]/g, "").trim();
  const cleanCategory = category.replace(/[^\w\s]/g, "").trim();

  let altText = "";

  if (cleanBrand) {
    altText += `${cleanBrand} `;
  }

  altText += cleanName;

  if (cleanCategory) {
    altText += ` - ${cleanCategory}`;
  }

  if (imageNumber > 1) {
    altText += ` - Image ${imageNumber}`;
  }

  return altText;
}

// Run the restoration
restoreImagesFromCSV()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
