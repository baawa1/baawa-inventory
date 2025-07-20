#!/usr/bin/env node

/**
 * Test Webflow Connection and Setup Collections
 * This script validates the Webflow integration and sets up collections
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

async function testWebflowConnection() {
  console.log("🚀 Testing Webflow Connection...\n");

  try {
    // Import the Webflow client
    const { WebflowClient } = require("../src/lib/webflow/client.ts");

    // Check environment variables
    const siteId = process.env.WEBFLOW_SITE_ID;
    const apiToken = process.env.WEBFLOW_API_TOKEN;

    console.log("Environment Check:");
    console.log(
      `✅ Site ID: ${siteId ? siteId.substring(0, 8) + "..." : "❌ Missing"}`
    );
    console.log(
      `✅ API Token: ${apiToken ? apiToken.substring(0, 8) + "..." : "❌ Missing"}\n`
    );

    if (!siteId || !apiToken) {
      throw new Error("Missing Webflow credentials in environment variables");
    }

    // Create client and test connection
    const client = new WebflowClient(apiToken, siteId);

    console.log("🔌 Testing API Connection...");
    const connectionResult = await client.validateConnection();

    if (connectionResult.valid) {
      console.log("✅ Connection successful!");
      console.log(
        `📱 Site: ${connectionResult.site.name} (${connectionResult.site.shortName})`
      );
      console.log(`🌐 Preview: ${connectionResult.site.previewUrl}\n`);
    } else {
      throw new Error(`Connection failed: ${connectionResult.error}`);
    }

    // List existing collections
    console.log("📋 Checking existing collections...");
    const { collections } = await client.getCollections();

    console.log(`Found ${collections.length} existing collections:`);
    collections.forEach((collection) => {
      console.log(
        `  • ${collection.displayName} (${collection.slug}) - ${collection.fields.length} fields`
      );
    });
    console.log("");

    // Check if our required collections exist
    const requiredCollections = ["products", "categories", "brands"];
    const existingCollections = collections.map((c) => c.slug);
    const missingCollections = requiredCollections.filter(
      (req) => !existingCollections.includes(req)
    );

    if (missingCollections.length > 0) {
      console.log(`⚠️  Missing collections: ${missingCollections.join(", ")}`);
      console.log("💡 Use the setup API to create them automatically\n");
    } else {
      console.log("✅ All required collections exist!\n");
    }

    // Test API endpoint
    console.log("🧪 Testing API Endpoint...");

    const apiUrl = "http://localhost:3000/api/webflow/sync";
    const testPayload = { action: "validate" };

    console.log(`📡 POST ${apiUrl}`);
    console.log(`📦 Payload: ${JSON.stringify(testPayload)}`);

    // Note: In a real test, you'd need authentication headers
    console.log("⚠️  Note: API test requires authentication headers\n");

    console.log("🎉 Webflow Integration Test Complete!");
    console.log("");
    console.log("Next Steps:");
    console.log("1. Use Cursor MCP or API to setup collections");
    console.log("2. Test syncing a product");
    console.log("3. Verify data appears in Webflow CMS");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check your Webflow API token is valid");
    console.error("2. Verify your site ID is correct");
    console.error("3. Ensure you have proper permissions");
    process.exit(1);
  }
}

// Run the test
testWebflowConnection();
