const fs = require("fs");

function debugCSVParsing(csvFilePath) {
  const csvContent = fs.readFileSync(csvFilePath, "utf-8");
  const lines = csvContent.split("\n");

  // Parse first line (headers)
  const headerLine = lines[0];
  const headers = [];
  let current = "";
  let inQuotes = false;

  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      headers.push(current.trim().replace(/"/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/"/g, ""));

  console.log("=== HEADERS DEBUG ===");
  console.log("Total headers:", headers.length);
  headers.forEach((header, index) => {
    console.log(`${index}: "${header}"`);
  });

  // Parse second line (first product)
  console.log("\n=== FIRST PRODUCT DEBUG ===");
  const dataLine = lines[1];
  const values = [];
  current = "";
  inQuotes = false;

  for (let j = 0; j < dataLine.length; j++) {
    const char = dataLine[j];
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

  console.log("Total values:", values.length);

  // Show key fields
  const nameIndex = headers.indexOf("Name");
  const skuIndex = headers.indexOf("SKU");
  const visibilityIndex = headers.indexOf("Visibility in catalog");

  console.log(`Name index: ${nameIndex}, value: "${values[nameIndex]}"`);
  console.log(`SKU index: ${skuIndex}, value: "${values[skuIndex]}"`);
  console.log(
    `Visibility index: ${visibilityIndex}, value: "${values[visibilityIndex]}"`
  );

  // Check if headers and values match
  console.log("\n=== FIELD MAPPING ===");
  headers.forEach((header, index) => {
    if (
      header === "Name" ||
      header === "SKU" ||
      header === "Visibility in catalog"
    ) {
      console.log(`${header} (${index}): "${values[index]}"`);
    }
  });
}

debugCSVParsing("wc-product-export-18-6-2025-1750220421093.csv");
