#!/usr/bin/env node

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

/**
 * Test the forgot password functionality
 */

const testForgotPassword = async () => {
  console.log("🧪 Testing Forgot Password Functionality");
  console.log("=".repeat(50));

  // Use a test email that should exist in the database
  const testEmail = "baawapay+test4@gmail.com"; // This was created in previous tests

  try {
    console.log("\n📝 Testing forgot password request...");
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

    console.log("✅ Forgot password request successful");
    console.log(`📧 Response: ${forgotData.message}`);
    console.log("📧 Check email for reset link");

    console.log("\n🎯 What should happen next:");
    console.log("1. User receives password reset email");
    console.log("2. User clicks reset link with token");
    console.log("3. User is taken to /reset-password?token=...");
    console.log("4. User enters new password");
    console.log("5. Password is updated in database");

    console.log("\n✅ Forgot Password Test Complete!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
};

testForgotPassword();
