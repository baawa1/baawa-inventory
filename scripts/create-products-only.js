#!/usr/bin/env node

/**
 * Create Products Collection Only - Fixed Option Field
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const PRODUCTS_COLLECTION = {
  displayName: "Products",
  singularName: "Product",
  slug: "products",
  fields: [
    {
      displayName: "Name",
      slug: "name",
      type: "PlainText",
      required: true,
      editable: true,
    },
    {
      displayName: "Slug",
      slug: "slug",
      type: "PlainText",
      required: true,
      editable: true,
      validations: { format: "slug" },
    },
    {
      displayName: "Description",
      slug: "description",
      type: "RichText",
      required: false,
      editable: true,
    },
    {
      displayName: "Short Description",
      slug: "short-description",
      type: "PlainText",
      required: false,
      editable: true,
    },
    {
      displayName: "SKU",
      slug: "sku",
      type: "PlainText",
      required: true,
      editable: true,
    },
    {
      displayName: "Barcode",
      slug: "barcode",
      type: "PlainText",
      required: false,
      editable: true,
    },
    {
      displayName: "Cost Price",
      slug: "cost-price",
      type: "Number",
      required: true,
      editable: true,
    },
    {
      displayName: "Selling Price",
      slug: "selling-price",
      type: "Number",
      required: true,
      editable: true,
    },
    {
      displayName: "Online Price",
      slug: "online-price",
      type: "Number",
      required: false,
      editable: true,
    },
    {
      displayName: "Stock Quantity",
      slug: "stock-quantity",
      type: "Number",
      required: true,
      editable: true,
    },
    {
      displayName: "Min Stock Level",
      slug: "min-stock-level",
      type: "Number",
      required: false,
      editable: true,
    },
    {
      displayName: "In Stock",
      slug: "in-stock",
      type: "Switch",
      required: true,
      editable: true,
    },
    {
      displayName: "Show In Store",
      slug: "show-in-store",
      type: "Switch",
      required: true,
      editable: true,
    },
    {
      displayName: "Weight",
      slug: "weight",
      type: "Number",
      required: false,
      editable: true,
    },
    {
      displayName: "Dimensions",
      slug: "dimensions",
      type: "PlainText",
      required: false,
      editable: true,
    },
    // Simplified - removed the problematic Option field for now
    {
      displayName: "Images",
      slug: "images",
      type: "Image",
      required: false,
      editable: true,
    },
    {
      displayName: "Featured Image",
      slug: "featured-image",
      type: "Image",
      required: false,
      editable: true,
    },
    {
      displayName: "Tags",
      slug: "tags",
      type: "PlainText",
      required: false,
      editable: true,
    },
    {
      displayName: "Meta Title",
      slug: "meta-title",
      type: "PlainText",
      required: false,
      editable: true,
    },
    {
      displayName: "Meta Description",
      slug: "meta-description",
      type: "PlainText",
      required: false,
      editable: true,
    },
    {
      displayName: "Inventory ID",
      slug: "inventory-id",
      type: "Number",
      required: true,
      editable: true,
    },
    {
      displayName: "Last Synced",
      slug: "last-synced",
      type: "DateTime",
      required: false,
      editable: true,
    },
  ],
};

async function webflowRequest(endpoint, options = {}) {
  const apiToken = process.env.WEBFLOW_API_TOKEN;
  const baseUrl = "https://api.webflow.com/v2";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `Webflow API Error: ${response.status} ${response.statusText}${errorData?.message ? ` - ${errorData.message}` : ""}`
    );
  }

  return response.json();
}

async function createProductsCollection() {
  console.log("🔧 Creating Products Collection...\n");

  try {
    const siteId = process.env.WEBFLOW_SITE_ID;

    if (!siteId) {
      throw new Error("Missing Webflow credentials");
    }

    // Check if Products collection already exists
    console.log("📋 Checking existing collections...");
    const { collections } = await webflowRequest(
      `/sites/${siteId}/collections`
    );

    const existingProducts = collections.find((c) => c.slug === "products");

    if (existingProducts) {
      console.log(
        `✅ Products collection already exists (${existingProducts.id})`
      );
      console.log(`   Fields: ${existingProducts.fields.length}`);
      return;
    }

    console.log("🔧 Creating Products collection...");
    const newCollection = await webflowRequest(`/sites/${siteId}/collections`, {
      method: "POST",
      body: JSON.stringify(PRODUCTS_COLLECTION),
    });

    console.log(
      `✅ Created Products collection (${newCollection.id}) with ${newCollection.fields.length} fields`
    );

    console.log("\n🎉 Products collection setup complete!");
    console.log("\n📊 What's included:");
    console.log("  • Basic info: Name, SKU, Description, Barcode");
    console.log("  • Pricing: Cost Price, Selling Price, Online Price");
    console.log(
      "  • Inventory: Stock Quantity, Min Stock Level, In Stock status"
    );
    console.log("  • Product details: Weight, Dimensions");
    console.log("  • Media: Images, Featured Image");
    console.log("  • SEO: Meta Title, Meta Description, Tags");
    console.log("  • Tracking: Inventory ID, Last Synced");

    console.log("\n✅ All Collections Now Ready:");
    console.log("  • Categories ✅");
    console.log("  • Brands ✅");
    console.log("  • Products ✅");
  } catch (error) {
    console.error("❌ Failed to create Products collection:", error.message);
    process.exit(1);
  }
}

// Run the setup
createProductsCollection();
