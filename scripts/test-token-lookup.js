#!/usr/bin/env node

const API_BASE = "http://localhost:3000";

async function testWithDatabaseToken() {
  console.log("Testing Password Reset with Database Token Lookup...\n");

  try {
    // 1. Request password reset
    console.log("1. Requesting password reset...");
    const forgotResponse = await fetch(
      `${API_BASE}/api/auth/forgot-password-supabase`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@baawa.com",
        }),
      }
    );

    if (forgotResponse.ok) {
      console.log("   ✅ Password reset requested successfully");

      // Wait a moment for database update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("\n2. Now manually check the database for the token...");
      console.log("   Please run this SQL query in Supabase or MCP:");
      console.log(
        "   SELECT reset_token FROM users WHERE email = 'admin@baawa.com';"
      );
      console.log("\n   Then use that token to test validation manually.");
    } else {
      console.log("   ❌ Password reset request failed");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testWithDatabaseToken();
