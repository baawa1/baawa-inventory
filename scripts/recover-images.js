const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recoverImages() {
  try {
    console.log("🔍 Starting image recovery process...\n");

    // Step 1: Check if we have any backup data in git
    console.log("📋 Step 1: Checking for backup data...");

    // Get all products that should have had images
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        brand: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
      },
    });

    console.log(`📊 Found ${products.length} products in database`);

    // Step 2: Check Supabase Storage
    console.log("\n📋 Step 2: Checking Supabase Storage...");

    try {
      const { data: files, error } = await supabase.storage
        .from("products")
        .list("", {
          limit: 1000,
          offset: 0,
        });

      if (error) {
        console.log("❌ Could not access Supabase Storage:", error.message);
        console.log(
          "   This might be due to permissions or configuration issues."
        );
      } else {
        console.log(`📸 Found ${files.length} files in Supabase Storage`);

        if (files.length > 0) {
          console.log("\n📋 Files available for recovery:");
          files.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.name}`);
          });

          console.log("\n✅ Images are still in Supabase Storage!");
          console.log(
            "   We can recover them by matching filenames to products."
          );
        }
      }
    } catch (storageError) {
      console.log("❌ Error accessing Supabase Storage:", storageError.message);
    }

    // Step 3: Check for any recent database backups
    console.log("\n📋 Step 3: Recovery recommendations...");

    console.log("\n🔧 Recovery Options:");
    console.log("1. ✅ Check Supabase Storage (if accessible)");
    console.log("2. 🔍 Check your database backup files");
    console.log("3. 📝 Check recent git commits for image data");
    console.log("4. 🗄️ Check if you have any database dumps");
    console.log("5. 🔄 Re-upload images manually if needed");

    // Step 4: Create a recovery plan
    console.log("\n📋 Step 4: Recovery Plan");

    if (products.length > 0) {
      console.log("\n📝 Products that need image recovery:");
      products.slice(0, 10).forEach((product) => {
        console.log(`  - ${product.name} (SKU: ${product.sku})`);
      });

      if (products.length > 10) {
        console.log(`  ... and ${products.length - 10} more products`);
      }
    }

    console.log("\n💡 Next Steps:");
    console.log(
      "1. If Supabase Storage has the files, we can create a recovery script"
    );
    console.log("2. If not, you may need to re-upload the images");
    console.log(
      "3. The new system will work better with alt text and meaningful filenames"
    );
  } catch (error) {
    console.error("❌ Error during recovery process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

recoverImages();
