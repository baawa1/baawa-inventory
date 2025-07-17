const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkImageData() {
  try {
    console.log("🔍 Checking image data in database...\n");

    // Check total products
    const totalProducts = await prisma.product.count();
    console.log(`📊 Total products: ${totalProducts}`);

    // Check products with images
    const productsWithImages = await prisma.product.findMany({
      where: {
        images: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        images: true,
      },
    });

    console.log(`📸 Products with images: ${productsWithImages.length}`);

    if (productsWithImages.length > 0) {
      console.log("\n📋 Products with image data:");
      productsWithImages.forEach((product) => {
        console.log(`  - ID: ${product.id}, Name: ${product.name}`);
        if (Array.isArray(product.images)) {
          console.log(`    Images: ${product.images.length} items`);
          product.images.forEach((img, index) => {
            if (typeof img === "string") {
              console.log(`      ${index + 1}. URL: ${img}`);
            } else if (typeof img === "object" && img.url) {
              console.log(
                `      ${index + 1}. URL: ${img.url}, Alt: ${img.alt || "N/A"}`
              );
            }
          });
        } else {
          console.log(`    Images: ${JSON.stringify(product.images)}`);
        }
      });
    } else {
      console.log("\n❌ No products with image data found!");
      console.log(
        "   This confirms that the migration cleared the image data."
      );
    }

    // Check for any backup or recovery options
    console.log("\n🔧 Recovery Options:");
    console.log("1. Check if you have database backups");
    console.log("2. Check if you have recent database dumps");
    console.log("3. Check if images are still in Supabase Storage");
    console.log("4. Check if you have recent git commits with image data");
  } catch (error) {
    console.error("❌ Error checking image data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageData();
