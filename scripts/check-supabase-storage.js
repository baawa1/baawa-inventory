const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Please check your .env file for:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL");
  console.log("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseStorage() {
  try {
    console.log("🔍 Checking Supabase Storage for images...\n");

    // List all files in the products bucket
    const { data: files, error } = await supabase.storage
      .from("products")
      .list("", {
        limit: 1000,
        offset: 0,
      });

    if (error) {
      console.error("❌ Error listing files:", error);
      return;
    }

    console.log(`📸 Found ${files.length} files in Supabase Storage`);

    if (files.length > 0) {
      console.log("\n📋 Files in storage:");
      files.forEach((file, index) => {
        console.log(
          `  ${index + 1}. ${file.name} (${file.metadata?.size || "unknown size"} bytes)`
        );
      });

      console.log("\n✅ Good news! Images are still in Supabase Storage.");
      console.log("   We can recover them by creating a recovery script.");
    } else {
      console.log("\n❌ No files found in Supabase Storage");
    }
  } catch (error) {
    console.error("❌ Error checking Supabase Storage:", error);
  }
}

checkSupabaseStorage();
