#!/usr/bin/env node

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

/**
 * Test the complete password reset flow
 */

const testPasswordResetFlow = async () => {
  console.log("🧪 Testing Complete Password Reset Flow");
  console.log("=".repeat(50));

  // Use a test email that should exist in the database
  const testEmail = "baawapay+test4@gmail.com"; // This was created in previous tests

  try {
    // Step 1: Request password reset
    console.log("\n📝 Step 1: Requesting password reset...");
    const forgotResponse = await fetch(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      }
    );

    const forgotData = await forgotResponse.json();

    if (!forgotResponse.ok) {
      throw new Error(`Forgot password failed: ${forgotData.error}`);
    }

    console.log("✅ Password reset request successful");
    console.log(`📧 Response: ${forgotData.message}`);

    // Step 2: Get the reset token from database (simulating email click)
    console.log("\n🔍 Step 2: Getting reset token from database...");

    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Wait a moment for the token to be saved
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data: userWithToken, error: tokenError } = await supabase
      .from("users")
      .select("password_reset_token, password_reset_expires")
      .eq("email", testEmail)
      .single();

    if (tokenError || !userWithToken?.password_reset_token) {
      throw new Error(
        `Could not get reset token: ${tokenError?.message || "Token not found"}`
      );
    }

    const resetToken = userWithToken.password_reset_token;
    const expiresAt = userWithToken.password_reset_expires;

    console.log("✅ Reset token retrieved from database");
    console.log(`🔗 Token: ${resetToken.substring(0, 20)}...`);
    console.log(`⏰ Expires: ${expiresAt}`);

    // Step 3: Validate the token
    console.log("\n🔍 Step 3: Validating reset token...");
    const validateResponse = await fetch(
      "http://localhost:3000/api/auth/validate-reset-token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken }),
      }
    );

    const validateData = await validateResponse.json();

    if (!validateResponse.ok) {
      throw new Error(`Token validation failed: ${validateData.error}`);
    }

    console.log("✅ Token validation successful");
    console.log(`✅ Token is valid: ${validateData.valid}`);

    // Step 4: Test the reset password API
    console.log("\n🔐 Step 4: Testing password reset...");
    const resetResponse = await fetch(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          password: "NewPassword123",
        }),
      }
    );

    const resetData = await resetResponse.json();

    if (!resetResponse.ok) {
      throw new Error(`Password reset failed: ${resetData.error}`);
    }

    console.log("✅ Password reset successful");
    console.log(`📧 Response: ${resetData.message}`);

    console.log("\n🎯 Complete Password Reset Flow Test Results:");
    console.log("✅ Step 1: Password reset email sent");
    console.log("✅ Step 2: Reset token stored in database");
    console.log("✅ Step 3: Token validation working");
    console.log("✅ Step 4: Password successfully updated");

    console.log("\n🔗 You can now test the UI at:");
    console.log(`   http://localhost:3000/reset-password?token=${resetToken}`);

    console.log("\n✅ Password Reset Flow Test Complete!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
};

testPasswordResetFlow();
