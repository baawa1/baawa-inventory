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

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProductImagesBucket() {
  try {
    console.log("Setting up product-images storage bucket...");

    // Create the bucket
    const { data: _bucketData, error: bucketError } =
      await supabase.storage.createBucket("product-images", {
        public: true,
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ],
        fileSizeLimit: 5242880, // 5MB limit
      });

    if (bucketError) {
      if (bucketError.message.includes("already exists")) {
        console.log("✅ product-images bucket already exists");
      } else {
        console.error("❌ Error creating bucket:", bucketError);
        return;
      }
    } else {
      console.log("✅ Created product-images bucket");
    }

    // Set up RLS policies for the bucket
    console.log("Setting up RLS policies...");

    // Policy to allow public read access
    const { error: readPolicyError } = await supabase.rpc("create_policy", {
      bucket_name: "product-images",
      policy_name: "Public read access",
      definition: "SELECT",
      check: "true",
    });

    if (readPolicyError) {
      console.log(
        "Read policy already exists or error:",
        readPolicyError.message
      );
    } else {
      console.log("✅ Created public read policy");
    }

    // Policy to allow authenticated users to upload
    const { error: uploadPolicyError } = await supabase.rpc("create_policy", {
      bucket_name: "product-images",
      policy_name: "Authenticated upload access",
      definition: "INSERT",
      check: "auth.role() = 'authenticated'",
    });

    if (uploadPolicyError) {
      console.log(
        "Upload policy already exists or error:",
        uploadPolicyError.message
      );
    } else {
      console.log("✅ Created authenticated upload policy");
    }

    // Policy to allow authenticated users to update their uploads
    const { error: updatePolicyError } = await supabase.rpc("create_policy", {
      bucket_name: "product-images",
      policy_name: "Authenticated update access",
      definition: "UPDATE",
      check: "auth.role() = 'authenticated'",
    });

    if (updatePolicyError) {
      console.log(
        "Update policy already exists or error:",
        updatePolicyError.message
      );
    } else {
      console.log("✅ Created authenticated update policy");
    }

    // Policy to allow authenticated users to delete their uploads
    const { error: deletePolicyError } = await supabase.rpc("create_policy", {
      bucket_name: "product-images",
      policy_name: "Authenticated delete access",
      definition: "DELETE",
      check: "auth.role() = 'authenticated'",
    });

    if (deletePolicyError) {
      console.log(
        "Delete policy already exists or error:",
        deletePolicyError.message
      );
    } else {
      console.log("✅ Created authenticated delete policy");
    }

    console.log("\n🎉 Supabase storage setup complete!");
    console.log("📁 Bucket: product-images");
    console.log(
      "🔗 Public URL format: https://your-project.supabase.co/storage/v1/object/public/product-images/filename.jpg"
    );
  } catch (error) {
    console.error("❌ Setup failed:", error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupProductImagesBucket();
}

module.exports = { setupProductImagesBucket };
