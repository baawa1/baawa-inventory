const fetch = require("node-fetch");

async function testImagesAPIDirect() {
  try {
    console.log("🔄 Testing images API endpoint directly...");

    const response = await fetch(
      "http://localhost:3000/api/products/400/images",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Response status:", response.status);
    console.log(
      "📊 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Error response:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Success response:");
    console.log(JSON.stringify(data, null, 2));

    if (data.images) {
      console.log(`\n🎯 Images count: ${data.images.length}`);
      data.images.forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.url} (${img.alt || "No alt"})`);
      });
    } else {
      console.log("❌ No images in response");
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

testImagesAPIDirect();
