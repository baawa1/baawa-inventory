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

console.log("🔧 Testing Supabase connection...");
console.log("🔧 Supabase URL:", supabaseUrl);
console.log("🔑 Service role key (last 4 chars):", supabaseKey.slice(-4));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log("\n📡 Testing basic connection...");

    // Test basic connection by trying to access the project
    const { data: _projectData, error: projectError } =
      await supabase.auth.getUser();

    if (projectError) {
      console.log(
        "ℹ️  Auth test result (expected for service role):",
        projectError.message
      );
    } else {
      console.log("✅ Basic connection successful");
    }

    console.log("\n📦 Testing storage access...");

    // Test storage by listing buckets
    const { data: buckets, error: storageError } =
      await supabase.storage.listBuckets();

    if (storageError) {
      console.error("❌ Storage access failed:", storageError);
      console.error("Error details:", storageError.message);

      if (storageError.message.includes("signature verification failed")) {
        console.log("\n🔍 Possible solutions:");
        console.log("1. Check if your Supabase project has Storage enabled");
        console.log("2. Verify your service role key is correct");
        console.log("3. Make sure your project is active and not paused");
        console.log(
          "4. Try regenerating your service role key in the Supabase dashboard"
        );
      }

      return;
    }

    console.log("✅ Storage access successful!");
    console.log(
      "📁 Existing buckets:",
      buckets.map((b) => b.name).join(", ") || "None"
    );

    // Check if product-images bucket exists
    const productImagesBucket = buckets.find(
      (b) => b.name === "product-images"
    );

    if (productImagesBucket) {
      console.log("✅ product-images bucket already exists!");
      console.log("🎉 You can start uploading images now!");
    } else {
      console.log("📦 product-images bucket does not exist yet");
      console.log(
        "💡 You can create it manually in the Supabase dashboard or run the setup script"
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error stack:", error.stack);
  }
}

// Run test if called directly
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection };
