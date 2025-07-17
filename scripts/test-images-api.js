const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testImagesAPI() {
  try {
    console.log("🔄 Testing images API for product 400...");

    // Get product 400 directly from database
    const product = await prisma.product.findUnique({
      where: { id: 400 },
      select: { id: true, name: true, images: true },
    });

    if (!product) {
      console.log("❌ Product 400 not found");
      return;
    }

    console.log("📊 Product found:", {
      id: product.id,
      name: product.name,
      imagesCount: product.images ? product.images.length : 0,
    });

    if (product.images) {
      console.log("🖼️  Images:");
      product.images.forEach((img, index) => {
        console.log(
          `  ${index + 1}. ${img.url} (${img.altText || "No alt text"})`
        );
      });
    } else {
      console.log("❌ No images found");
    }

    // Simulate the API logic
    let images = [];
    if (product.images) {
      if (
        Array.isArray(product.images) &&
        typeof product.images[0] === "string"
      ) {
        // Legacy format: string array
        const imageUrls = product.images;
        images = imageUrls.map((url, index) => ({
          id: `legacy-${index}`,
          url: url,
          filename: url.split("/").pop() || `image-${index}`,
          size: 0,
          mimeType: "image/jpeg",
          alt: "",
          isPrimary: index === 0,
          uploadedAt: new Date().toISOString(),
        }));
      } else {
        // New format: image object array - handle different property names
        const imageObjects = product.images;
        images = imageObjects.map((img, index) => ({
          id: img.id || `restored-${index}`,
          url: img.url,
          filename:
            img.filename || img.url.split("/").pop() || `image-${index}`,
          size: img.size || 0,
          mimeType: img.mimeType || "image/jpeg",
          alt: img.alt || img.altText || "",
          isPrimary: img.isPrimary || index === 0,
          uploadedAt: img.uploadedAt || new Date().toISOString(),
        }));
      }
    }

    console.log("\n🎯 API Response would be:");
    console.log(
      JSON.stringify(
        {
          productId: product.id,
          productName: product.name,
          images: images,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testImagesAPI();
