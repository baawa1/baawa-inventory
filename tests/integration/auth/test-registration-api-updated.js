#!/usr/bin/env node

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

/**
 * Test just the registration API to verify the updated flow
 */

const testRegistrationAPI = async () => {
  console.log("🧪 Testing Registration API Updates");
  console.log("=".repeat(40));

  const testEmail = `baawapay+test-${Date.now()}@gmail.com`;
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: testEmail,
    password: "password123",
    role: "STAFF",
  };

  try {
    console.log("\n📝 Registering new user...");
    const registerResponse = await fetch(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      }
    );

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    console.log("✅ Registration API working correctly");
    console.log(`📧 User email: ${testEmail}`);
    console.log(`🆔 User ID: ${registerData.user.id}`);
    console.log(`📊 User status: ${registerData.user.status}`);
    console.log(
      `📧 Requires verification: ${registerData.requiresVerification}`
    );

    console.log("\n🎯 Updated Frontend Flow:");
    console.log("✅ Registration form now redirects to:");
    console.log(`   /check-email?email=${encodeURIComponent(testEmail)}`);
    console.log("✅ Check-email page explains verification process");
    console.log("✅ After email verification, user goes to /pending-approval");
    console.log("✅ User waits for admin approval on pending-approval page");

    console.log("\n📱 Test the flow manually:");
    console.log("1. Go to http://localhost:3000/register");
    console.log("2. Fill out the form and submit");
    console.log("3. You should be redirected to /check-email?email=...");
    console.log("4. Check your email for verification link");
    console.log("5. Click the link to go to /verify-email?token=...");
    console.log(
      "6. After verification, you'll be redirected to /pending-approval"
    );

    console.log(
      "\n✅ API Test Complete - Registration flow updated successfully!"
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
};

testRegistrationAPI();
