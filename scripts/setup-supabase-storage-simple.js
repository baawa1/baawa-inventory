require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

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

console.log("🔧 Supabase URL:", supabaseUrl);
console.log("🔑 Using service role key (last 4 chars):", supabaseKey.slice(-4));

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProductImagesBucket() {
  try {
    console.log("\n📦 Setting up product-images storage bucket...");

    // First, check if bucket already exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listing buckets:", listError);
      return;
    }

    const bucketExists = buckets.some(
      (bucket) => bucket.name === "product-images"
    );

    if (bucketExists) {
      console.log("✅ product-images bucket already exists");
    } else {
      // Create the bucket
      const { data: _data, error } = await supabase.storage.createBucket(
        "product-images",
        {
          public: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          fileSizeLimit: 5242880, // 5MB limit
        }
      );

      if (error) {
        console.error("❌ Error creating bucket:", error);
        console.error("Error details:", error.message);
        return;
      } else {
        console.log("✅ Created product-images bucket successfully");
      }
    }

    console.log("\n🎉 Supabase storage setup complete!");
    console.log("📁 Bucket: product-images");
    console.log(
      "🔗 Public URL format: https://your-project.supabase.co/storage/v1/object/public/product-images/filename.jpg"
    );
    console.log(
      "\n💡 You can now upload images through the ProductImageManager component!"
    );
  } catch (error) {
    console.error("❌ Setup failed:", error);
    console.error("Error stack:", error.stack);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupProductImagesBucket();
}

module.exports = { setupProductImagesBucket };
