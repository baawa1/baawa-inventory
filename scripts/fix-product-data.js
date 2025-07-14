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

// Function to fix product data and extract brands
async function fixProductData(csvFilePath) {
  try {
    console.log("Reading WooCommerce CSV...");
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
    const brandIndex = headers.indexOf("Brands");

    console.log("Column indices:");
    console.log(`- Name: ${nameIndex}`);
    console.log(`- SKU: ${skuIndex}`);
    console.log(`- Brand: ${brandIndex}`);

    let updatedCount = 0;
    let brandCount = 0;
    const brandMap = new Map();

    // Process each product record (skip header)
    for (let i = 1; i < records.length; i++) {
      // Process all records
      const record = records[i];

      if (record.length < 10) continue; // Skip incomplete records

      const sku = record[skuIndex]?.replace(/"/g, "").trim();
      const name = record[nameIndex]?.replace(/"/g, "").trim();

      if (!sku || !name) continue;

      console.log(`Processing: ${sku} - ${name.substring(0, 50)}...`);

      try {
        // Find existing product by SKU
        const existingProduct = await prisma.product.findUnique({
          where: { sku: sku },
        });

        if (!existingProduct) {
          console.log(`  Product ${sku} not found in database`);
          continue;
        }

        // Extract brand from name
        const brandName = extractBrandFromName(name);
        let brandId = null;

        if (brandName) {
          // Create or find brand
          const brand = await prisma.brand.upsert({
            where: { name: brandName },
            update: {},
            create: {
              name: brandName,
              isActive: true,
            },
          });

          brandId = brand.id;
          if (!brandMap.has(brandName)) {
            brandMap.set(brandName, 0);
            brandCount++;
          }
          brandMap.set(brandName, brandMap.get(brandName) + 1);
        }

        // Update product with correct data
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: name,
            brandId: brandId,
          },
        });

        console.log(
          `  ✅ Updated: ${name.substring(0, 30)}... ${brandName ? `(Brand: ${brandName})` : ""}`
        );
        updatedCount++;
      } catch (error) {
        console.error(`  ❌ Error updating ${sku}:`, error.message);
      }
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`- ${updatedCount} products updated with correct names`);
    console.log(`- ${brandCount} brands created`);

    console.log("\n=== Brand Summary ===");
    const sortedBrands = Array.from(brandMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    sortedBrands.forEach(([brand, count]) => {
      console.log(`- ${brand}: ${count} products`);
    });
  } catch (error) {
    console.error("Error fixing product data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (process.argv[2]) {
  fixProductData(process.argv[2]);
} else {
  console.log("Usage: node fix-product-data.js <csv-file>");
}
