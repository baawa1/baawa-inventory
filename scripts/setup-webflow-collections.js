#!/usr/bin/env node

/**
 * Setup Webflow Collections
 * This script creates the Products, Categories, and Brands collections in Webflow
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

async function setupWebflowCollections() {
  console.log("🏗️  Setting up Webflow Collections...\n");

  try {
    // Import required modules
    const { WebflowClient } = require("../src/lib/webflow/client.ts");
    const {
      webflowCollectionManager,
    } = require("../src/lib/webflow/collections.ts");

    // Check environment variables
    const siteId = process.env.WEBFLOW_SITE_ID;
    const apiToken = process.env.WEBFLOW_API_TOKEN;

    if (!siteId || !apiToken) {
      throw new Error("Missing Webflow credentials in environment variables");
    }

    console.log("🔧 Initializing Webflow Client...");
    const client = new WebflowClient(apiToken, siteId);

    // Validate connection first
    console.log("🔌 Validating connection...");
    const connectionResult = await client.validateConnection();

    if (!connectionResult.valid) {
      throw new Error(`Connection failed: ${connectionResult.error}`);
    }

    console.log(
      `✅ Connected to: ${connectionResult.site.name || connectionResult.site.shortName}\n`
    );

    // Setup collections using the collection manager
    console.log("📚 Setting up collections...");
    const setupResult = await webflowCollectionManager.setupCollections();

    if (setupResult.success) {
      console.log("✅ Collections setup successful!\n");

      console.log("📊 Created Collections:");

      if (setupResult.collections.categories) {
        console.log(
          `  ✅ Categories Collection: ${setupResult.collections.categories.id}`
        );
        console.log(
          `     Fields: ${setupResult.collections.categories.fields.length}`
        );
      }

      if (setupResult.collections.brands) {
        console.log(
          `  ✅ Brands Collection: ${setupResult.collections.brands.id}`
        );
        console.log(
          `     Fields: ${setupResult.collections.brands.fields.length}`
        );
      }

      if (setupResult.collections.products) {
        console.log(
          `  ✅ Products Collection: ${setupResult.collections.products.id}`
        );
        console.log(
          `     Fields: ${setupResult.collections.products.fields.length}`
        );
      }

      console.log("\n🎯 What's included in each collection:");

      console.log("\n📦 Products Collection:");
      console.log("  • Basic info: Name, SKU, Description, Barcode");
      console.log("  • Pricing: Cost Price, Selling Price, Online Price");
      console.log(
        "  • Inventory: Stock Quantity, Min Stock Level, In Stock status"
      );
      console.log("  • Product details: Weight, Dimensions, Status");
      console.log("  • Media: Images (multiple), Featured Image");
      console.log("  • SEO: Meta Title, Meta Description, Tags");
      console.log("  • Tracking: Inventory ID, Last Synced");

      console.log("\n📂 Categories Collection:");
      console.log("  • Basic: Name, Description, Image");
      console.log("  • Organization: Active status, Sort Order");
      console.log("  • SEO: Meta Title, Meta Description");
      console.log("  • Tracking: Inventory ID, Last Synced");

      console.log("\n🏷️  Brands Collection:");
      console.log("  • Basic: Name, Description, Logo, Website");
      console.log("  • Organization: Active status, Sort Order");
      console.log("  • SEO: Meta Title, Meta Description");
      console.log("  • Tracking: Inventory ID, Last Synced");

      console.log("\n🚀 Next Steps:");
      console.log("1. ✅ Collections are ready!");
      console.log("2. 🔄 Test syncing data from your inventory");
      console.log("3. 📱 Check your Webflow CMS to see the new collections");
      console.log(
        "4. 🎨 Start designing your Webflow pages using these collections"
      );
    } else {
      console.error("❌ Collection setup failed:");
      setupResult.errors.forEach((error) => {
        console.error(`  • ${error}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error(
      "1. Check your Webflow API token has collection creation permissions"
    );
    console.error("2. Verify your Webflow plan supports API access");
    console.error("3. Ensure your site isn't at the collection limit");
    process.exit(1);
  }
}

// Run the setup
setupWebflowCollections();
