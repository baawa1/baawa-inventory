const http = require("http");

async function testImagesAPISimple() {
  try {
    console.log("🔄 Testing images API endpoint...");

    const url = "http://localhost:3000/api/products/400/images";
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Test-Script",
      },
    };

    const req = http.request(options, (res) => {
      console.log("📊 Response status:", res.statusCode);
      console.log("📊 Response headers:", res.headers);

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            console.log("✅ Success response:");
            console.log(JSON.stringify(jsonData, null, 2));

            if (jsonData.images) {
              console.log(`\n🎯 Images count: ${jsonData.images.length}`);
              jsonData.images.forEach((img, idx) => {
                console.log(
                  `  ${idx + 1}. ${img.url} (${img.alt || "No alt"})`
                );
              });
            } else {
              console.log("❌ No images in response");
            }
          } else {
            console.log("❌ Error response:", data);
          }
        } catch (parseError) {
          console.log("❌ Parse error:", parseError.message);
          console.log("Raw response:", data);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Request error:", error.message);
    });

    req.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testImagesAPISimple();
