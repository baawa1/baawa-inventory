#!/usr/bin/env node

/**
 * Create Webflow Collections - Direct API Approach
 * This script creates collections using direct API calls
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

// Collection structures
const COLLECTIONS = {
  categories: {
    displayName: "Categories",
    singularName: "Category",
    slug: "categories",
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
        validations: { format: "slug", unique: true },
      },
      {
        displayName: "Description",
        slug: "description",
        type: "RichText",
        required: false,
        editable: true,
      },
      {
        displayName: "Image",
        slug: "image",
        type: "ImageRef",
        required: false,
        editable: true,
      },
      {
        displayName: "Active",
        slug: "active",
        type: "Bool",
        required: true,
        editable: true,
      },
      {
        displayName: "Sort Order",
        slug: "sort-order",
        type: "Number",
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
        validations: { unique: true, precision: 0 },
      },
      {
        displayName: "Last Synced",
        slug: "last-synced",
        type: "DateTime",
        required: false,
        editable: true,
      },
    ],
  },

  brands: {
    displayName: "Brands",
    singularName: "Brand",
    slug: "brands",
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
        validations: { format: "slug", unique: true },
      },
      {
        displayName: "Description",
        slug: "description",
        type: "RichText",
        required: false,
        editable: true,
      },
      {
        displayName: "Logo",
        slug: "logo",
        type: "ImageRef",
        required: false,
        editable: true,
      },
      {
        displayName: "Website",
        slug: "website",
        type: "Link",
        required: false,
        editable: true,
      },
      {
        displayName: "Active",
        slug: "active",
        type: "Bool",
        required: true,
        editable: true,
      },
      {
        displayName: "Sort Order",
        slug: "sort-order",
        type: "Number",
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
        validations: { unique: true, precision: 0 },
      },
      {
        displayName: "Last Synced",
        slug: "last-synced",
        type: "DateTime",
        required: false,
        editable: true,
      },
    ],
  },

  products: {
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
        validations: { format: "slug", unique: true },
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
        validations: { unique: true },
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
        validations: { precision: 2, min: 0 },
      },
      {
        displayName: "Selling Price",
        slug: "selling-price",
        type: "Number",
        required: true,
        editable: true,
        validations: { precision: 2, min: 0 },
      },
      {
        displayName: "Online Price",
        slug: "online-price",
        type: "Number",
        required: false,
        editable: true,
        validations: { precision: 2, min: 0 },
      },
      {
        displayName: "Stock Quantity",
        slug: "stock-quantity",
        type: "Number",
        required: true,
        editable: true,
        validations: { precision: 0, min: 0 },
      },
      {
        displayName: "Min Stock Level",
        slug: "min-stock-level",
        type: "Number",
        required: false,
        editable: true,
        validations: { precision: 0, min: 0 },
      },
      {
        displayName: "In Stock",
        slug: "in-stock",
        type: "Bool",
        required: true,
        editable: true,
      },
      {
        displayName: "Show In Store",
        slug: "show-in-store",
        type: "Bool",
        required: true,
        editable: true,
      },
      {
        displayName: "Weight",
        slug: "weight",
        type: "Number",
        required: false,
        editable: true,
        validations: { precision: 2, min: 0 },
      },
      {
        displayName: "Dimensions",
        slug: "dimensions",
        type: "PlainText",
        required: false,
        editable: true,
      },
      {
        displayName: "Status",
        slug: "status",
        type: "Option",
        required: true,
        editable: true,
        validations: {
          options: [
            { name: "Active", id: "active" },
            { name: "Inactive", id: "inactive" },
            { name: "Discontinued", id: "discontinued" },
          ],
        },
      },
      {
        displayName: "Images",
        slug: "images",
        type: "ImageRef",
        required: false,
        editable: true,
        validations: { allowMultiple: true },
      },
      {
        displayName: "Featured Image",
        slug: "featured-image",
        type: "ImageRef",
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
        validations: { unique: true, precision: 0 },
      },
      {
        displayName: "Last Synced",
        slug: "last-synced",
        type: "DateTime",
        required: false,
        editable: true,
      },
    ],
  },
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

async function createCollections() {
  console.log("🏗️  Creating Webflow Collections...\n");

  try {
    const siteId = process.env.WEBFLOW_SITE_ID;
    const apiToken = process.env.WEBFLOW_API_TOKEN;

    if (!siteId || !apiToken) {
      throw new Error("Missing Webflow credentials");
    }

    console.log("Environment Check:");
    console.log(`✅ Site ID: ${siteId.substring(0, 8)}...`);
    console.log(`✅ API Token: ${apiToken.substring(0, 8)}...\n`);

    // Check existing collections
    console.log("📋 Checking existing collections...");
    const { collections } = await webflowRequest(
      `/sites/${siteId}/collections`
    );

    console.log(`Found ${collections.length} existing collections:`);
    collections.forEach((collection) => {
      console.log(`  • ${collection.displayName} (${collection.slug})`);
    });
    console.log("");

    // Create collections in order (categories and brands first, then products)
    const collectionsToCreate = ["categories", "brands", "products"];
    const createdCollections = {};

    for (const collectionType of collectionsToCreate) {
      const existing = collections.find((c) => c.slug === collectionType);

      if (existing) {
        console.log(
          `✅ ${COLLECTIONS[collectionType].displayName} collection already exists (${existing.id})`
        );
        createdCollections[collectionType] = existing;
      } else {
        console.log(
          `🔧 Creating ${COLLECTIONS[collectionType].displayName} collection...`
        );

        try {
          const newCollection = await webflowRequest(
            `/sites/${siteId}/collections`,
            {
              method: "POST",
              body: JSON.stringify(COLLECTIONS[collectionType]),
            }
          );

          console.log(
            `✅ Created ${newCollection.displayName} (${newCollection.id}) with ${newCollection.fields.length} fields`
          );
          createdCollections[collectionType] = newCollection;

          // Add a small delay between collections
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(
            `❌ Failed to create ${collectionType}:`,
            error.message
          );
        }
      }
    }

    console.log("\n🎉 Collection setup complete!");
    console.log("\n📊 Summary:");
    Object.entries(createdCollections).forEach(([_type, collection]) => {
      console.log(
        `  ✅ ${collection.displayName}: ${collection.fields.length} fields`
      );
    });

    console.log("\n🚀 Next Steps:");
    console.log("1. ✅ Collections are ready in your Webflow CMS!");
    console.log("2. 🔄 Test syncing data from your inventory system");
    console.log(
      "3. 📱 Go to your Webflow dashboard to see the new collections"
    );
    console.log("4. 🎨 Start designing your Webflow pages");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run the setup
createCollections();
