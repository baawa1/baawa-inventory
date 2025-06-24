#!/usr/bin/env node

const API_BASE = "http://localhost:3000";

async function testCompletePasswordResetFlow() {
  console.log("Testing Complete Password Reset Flow...\n");

  try {
    // 1. Request password reset
    console.log("1. Requesting password reset for admin@baawa.com...");
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

    const forgotResult = await forgotResponse.json();
    console.log(`   ✅ Reset requested: ${forgotResult.message}`);

    // 2. Simulate getting the token (in real scenario, this would come from email)
    // For testing, we'll use the actual token from database
    const mockToken =
      "39901d42bd18995cc2bf9b021d38af0c385c8e8c76049f594d081dc727793f4a"; // Current token from database

    // 3. Validate the reset token
    console.log("\n2. Validating reset token...");
    const validateResponse = await fetch(
      `${API_BASE}/api/auth/validate-reset-token-supabase`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: mockToken,
        }),
      }
    );

    const validateResult = await validateResponse.json();
    console.log(`   Status: ${validateResponse.status}`);
    console.log(`   Response:`, validateResult);

    if (validateResponse.ok) {
      console.log("   ✅ Token validation successful");

      // 4. Reset the password
      console.log("\n3. Resetting password...");
      const resetResponse = await fetch(
        `${API_BASE}/api/auth/reset-password-supabase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: mockToken,
            password: "NewSecurePassword123",
          }),
        }
      );

      const resetResult = await resetResponse.json();
      console.log(`   Status: ${resetResponse.status}`);
      console.log(`   Response:`, resetResult);

      if (resetResponse.ok) {
        console.log("   ✅ Password reset successful");
      } else {
        console.log("   ❌ Password reset failed");
      }
    } else {
      console.log("   ❌ Token validation failed");
    }

    console.log("\n🎯 Complete Password Reset Flow Test Complete!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testCompletePasswordResetFlow();
