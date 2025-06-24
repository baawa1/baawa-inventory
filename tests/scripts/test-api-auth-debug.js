// Simple API test to debug authentication issues
const fetch = require("node-fetch");

async function testAuthentication() {
  console.log("Testing API authentication...");

  try {
    const response = await fetch("http://localhost:3000/api/users", {
      credentials: "include",
      headers: {
        Cookie: "next-auth.session-token=test", // This would need to be a real session token
      },
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.raw());

    if (response.ok) {
      const data = await response.text();
      console.log("Response data:", data);
    } else {
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
  }
}

testAuthentication();
