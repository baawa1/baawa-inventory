const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Simulate the frontend component logic
function ensureUniqueImages(images) {
  return images.filter(
    (image, index, self) =>
      index === self.findIndex((img) => img.id === image.id)
  );
}

function generateAltText(product, index) {
  const brandText = product.brand?.name ? ` ${product.brand.name}` : "";
  const categoryText = product.category?.name
    ? ` ${product.category.name}`
    : "";

  if (index === 0) {
    return `${product.name}${brandText}${categoryText}`;
  } else {
    return `${product.name}${brandText}${categoryText} - Image ${index + 1}`;
  }
}

async function debugImagesDisplay() {
  try {
    console.log("🔄 Debugging images display for product 400...");

    // Get product 400 with complete data
    const product = await prisma.product.findUnique({
      where: { id: 400 },
      select: {
        id: true,
        name: true,
        images: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      console.log("❌ Product 400 not found");
      return;
    }

    console.log("📊 Product data:", {
      id: product.id,
      name: product.name,
      brand: product.brand?.name || "No brand",
      category: product.category?.name || "No category",
      imagesCount: product.images ? product.images.length : 0,
    });

    // Simulate API response
    const imageData = {
      productId: product.id,
      productName: product.name,
      images: product.images || [],
    };

    console.log("\n🎯 Raw API response:");
    console.log(JSON.stringify(imageData, null, 2));

    const rawImages = imageData.images || [];

    console.log("\n🔍 Processing raw images...");
    console.log("Raw images type:", typeof rawImages);
    console.log("Raw images is array:", Array.isArray(rawImages));
    console.log("Raw images length:", rawImages.length);

    // Simulate the frontend validation logic
    const validatedImages = Array.isArray(rawImages)
      ? rawImages.map((img, idx) => {
          console.log(`\nProcessing image ${idx}:`, img);

          if (typeof img === "string") {
            console.log(`  -> Legacy string format`);
            return {
              id: `legacy-${idx}`,
              url: img,
              filename: img.split("/").pop() || `image-${idx}`,
              size: 0,
              mimeType: "image/jpeg",
              alt: generateAltText(product, idx),
              isPrimary: idx === 0,
              uploadedAt: new Date().toISOString(),
            };
          }

          console.log(`  -> Object format`);
          const validated = {
            id: String(img.id || `restored-${idx}`),
            url: String(img.url),
            filename: String(
              img.filename || img.url.split("/").pop() || `image-${idx}`
            ),
            size: Number(img.size) || 0,
            mimeType: String(img.mimeType || "image/jpeg"),
            alt: img.alt ? String(img.alt) : generateAltText(product, idx),
            isPrimary: Boolean(img.isPrimary || idx === 0),
            uploadedAt: String(img.uploadedAt || new Date().toISOString()),
          };
          console.log(`  -> Validated:`, validated);
          return validated;
        })
      : [];

    console.log("\n✅ Validated images count:", validatedImages.length);

    // Apply unique filter
    const uniqueImages = ensureUniqueImages(validatedImages);
    console.log("🔍 After unique filter:", uniqueImages.length);

    // Apply URL filter
    const finalImages = uniqueImages.filter(
      (img) => img.url && img.url.trim() !== ""
    );
    console.log("🔍 After URL filter:", finalImages.length);

    console.log("\n🎯 Final images that would be displayed:");
    finalImages.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.url} (${img.alt})`);
    });

    if (finalImages.length !== product.images.length) {
      console.log("\n⚠️  WARNING: Image count mismatch!");
      console.log(
        `Expected: ${product.images.length}, Got: ${finalImages.length}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugImagesDisplay();
