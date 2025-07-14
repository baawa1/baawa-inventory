require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

// Helper function to properly parse CSV with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

// Function to extract unique brands from WooCommerce CSV
async function extractAndImportBrands(csvFilePath) {
  try {
    console.log("Reading WooCommerce CSV to extract brands...");

    const csvContent = fs.readFileSync(csvFilePath, "utf-8");
    const lines = csvContent.split("\n");

    // Parse header to find brand column
    const headers = parseCSVLine(lines[0]);
    const brandIndex = headers.findIndex((h) =>
      h.toLowerCase().includes("brand")
    );

    console.log("Headers found:", headers.length);
    console.log("Brand column index:", brandIndex);
    console.log("Brand column name:", headers[brandIndex]);

    if (brandIndex === -1) {
      console.log("No brand column found in CSV");
      return;
    }

    const uniqueBrands = new Set();

    // Parse each line to extract brands
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const fields = parseCSVLine(line);
      const brandValue = fields[brandIndex];

      if (
        brandValue &&
        brandValue.trim() &&
        brandValue !== '""' &&
        brandValue !== ""
      ) {
        const cleanBrand = brandValue.replace(/"/g, "").trim();
        if (
          cleanBrand &&
          cleanBrand.length > 0 &&
          cleanBrand !== "0" &&
          cleanBrand !== "1"
        ) {
          uniqueBrands.add(cleanBrand);
        }
      }
    }

    console.log("Unique brands found:", uniqueBrands.size);
    uniqueBrands.forEach((brand) => console.log("- ", brand));

    // Import brands to database
    let importedCount = 0;
    for (const brandName of uniqueBrands) {
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
      } catch (error) {
        console.error(
          `❌ Error importing brand "${brandName}":`,
          error.message
        );
      }
    }

    console.log(`\n🎉 Import complete! ${importedCount} brands imported.`);
  } catch (error) {
    console.error("Error extracting brands:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (process.argv[2]) {
  extractAndImportBrands(process.argv[2]);
} else {
  console.log("Usage: node fix-brands-import.js <csv-file>");
}
