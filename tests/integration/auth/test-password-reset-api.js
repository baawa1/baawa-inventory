#!/usr/bin/env node

// Test password reset API endpoints
const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

async function testPasswordResetAPI() {
  console.log("🔧 Testing Password Reset API Endpoints...\n");

  try {
    // Wait for server to be ready
    console.log("⏳ Waiting for server to start...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test 1: Forgot Password API
    console.log("1. Testing forgot password API...");
    const forgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "jane@example.com",
      }),
    });

    const forgotResult = await forgotResponse.json();
    console.log("   Response status:", forgotResponse.status);
    console.log("   Response:", forgotResult);

    if (forgotResponse.ok) {
      console.log("✅ Forgot password API working");
    } else {
      console.log("❌ Forgot password API failed");
    }

    // Test 2: Get the reset token from database
    console.log("\n2. Getting reset token from database...");
    const { createClient } = require("@supabase/supabase-js");
    require("dotenv").config({ path: ".env.local" });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("reset_token")
      .eq("email", "jane@example.com")
      .single();

    if (error) throw error;

    if (user && user.reset_token) {
      console.log("✅ Reset token found in database");
      const resetToken = user.reset_token;

      // Test 3: Validate Reset Token API
      console.log("\n3. Testing validate reset token API...");
      const validateResponse = await fetch(
        `${BASE_URL}/api/auth/validate-reset-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetToken,
          }),
        }
      );

      const validateResult = await validateResponse.json();
      console.log("   Response status:", validateResponse.status);
      console.log("   Response:", validateResult);

      if (validateResponse.ok) {
        console.log("✅ Validate reset token API working");

        // Test 4: Reset Password API
        console.log("\n4. Testing reset password API...");
        const resetResponse = await fetch(
          `${BASE_URL}/api/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: resetToken,
              password: "NewAPITestPassword123!",
            }),
          }
        );

        const resetResult = await resetResponse.json();
        console.log("   Response status:", resetResponse.status);
        console.log("   Response:", resetResult);

        if (resetResponse.ok) {
          console.log("✅ Reset password API working");
        } else {
          console.log("❌ Reset password API failed");
        }
      } else {
        console.log("❌ Validate reset token API failed");
      }
    } else {
      console.log("❌ No reset token found in database");
    }

    console.log("\n🎉 Password Reset API Test COMPLETED!");
  } catch (error) {
    console.error("\n❌ Password Reset API Test FAILED:");
    console.error("Error:", error.message);
  }
}

// Run the test
testPasswordResetAPI().catch(console.error);
