const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Checking Supabase configuration...");
console.log(`URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}`);
console.log(`Service Key: ${supabaseKey ? "✅ Set" : "❌ Missing"}`);

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkStorage() {
  try {
    console.log("\n🔍 Attempting to access Supabase Storage...");

    // Try to list files in the products bucket
    const { data, error } = await supabase.storage.from("products").list("", {
      limit: 100,
      offset: 0,
    });

    if (error) {
      console.error("❌ Storage access error:", error);

      // Try alternative approach
      console.log("\n🔄 Trying alternative approach...");

      // Check if bucket exists
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      if (bucketsError) {
        console.error("❌ Cannot list buckets:", bucketsError);
      } else {
        console.log("📦 Available buckets:");
        buckets.forEach((bucket) => {
          console.log(`  - ${bucket.name}`);
        });
      }

      return;
    }

    console.log(`✅ Successfully accessed storage!`);
    console.log(`📸 Found ${data.length} files in products bucket`);

    if (data.length > 0) {
      console.log("\n📋 Files found:");
      data.forEach((file, index) => {
        console.log(
          `  ${index + 1}. ${file.name} (${file.metadata?.size || "unknown"} bytes)`
        );
      });

      console.log(
        "\n🎉 Great news! Your images are still in Supabase Storage!"
      );
      console.log("   We can recover them by creating a recovery script.");
    } else {
      console.log("\n❌ No files found in storage");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkStorage();
