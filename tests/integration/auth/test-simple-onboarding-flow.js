#!/usr/bin/env node

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

/**
 * Simple test of the updated user onboarding flow:
 * 1. Register a new user
 * 2. Verify the user gets correct status and redirects
 * 3. Test that login is blocked until verification
 * 4. Clean up
 */

const testSimpleFlow = async () => {
  console.log("🧪 Testing Updated User Registration & Onboarding Flow");
  console.log("=".repeat(60));

  const testEmail = `baawapay+test-${Date.now()}@gmail.com`;
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: testEmail,
    password: "password123",
    role: "STAFF",
  };

  try {
    // Step 1: Register a new user
    console.log("\n📝 Step 1: Registering new user...");
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

    console.log("✅ Registration successful");
    console.log(`📧 User email: ${testEmail}`);
    console.log(`🆔 User ID: ${registerData.user.id}`);
    console.log(`📊 User status: ${registerData.user.status}`);
    console.log(
      `📧 Requires verification: ${registerData.requiresVerification}`
    );

    // Step 2: Check that frontend would redirect to check-email
    console.log("\n📄 Step 2: Expected frontend behavior:");
    console.log(`   ✅ Registration form should redirect to:`);
    console.log(`      /check-email?email=${encodeURIComponent(testEmail)}`);

    // Step 3: Test login with unverified user
    console.log("\n🔐 Step 3: Testing login with unverified user...");
    const loginResponse = await fetch("http://localhost:3000/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testUser.password,
      }),
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log("❌ ERROR: Login should have failed for unverified user");
    } else {
      console.log("✅ Login correctly blocked for unverified user");
      console.log(`📋 Error message: ${loginData.error}`);
    }

    // Step 4: Test the verification flow (without actually verifying)
    console.log("\n✉️  Step 4: Expected email verification flow:");
    console.log("   📧 User should receive verification email");
    console.log("   🔗 Email contains link to /verify-email?token=...");
    console.log(
      "   ✅ After clicking link, user should be redirected to /pending-approval"
    );
    console.log("   ⏳ User then waits for admin approval");

    // Step 5: Simulate what happens after admin approval
    console.log("\n👤 Step 5: After admin approval (simulated):");
    console.log("   📧 User receives approval notification email");
    console.log("   🔓 User can then login successfully");
    console.log("   🎯 User is redirected to dashboard");

    console.log("\n🎉 Flow Test Complete!");
    console.log("\n📋 Updated User Onboarding Summary:");
    console.log("   1. Registration → /check-email?email=...");
    console.log("   2. Email verification → /pending-approval");
    console.log("   3. Admin approval → Login allowed");
    console.log("   4. Login → Dashboard access");

    // Clean up: Try to use admin API to remove test user
    console.log("\n🧹 Cleaning up test user...");

    try {
      // Use the admin users API to delete the test user
      const deleteResponse = await fetch(
        `http://localhost:3000/api/users/${registerData.user.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (deleteResponse.ok) {
        console.log("✅ Test user cleaned up");
      } else {
        console.log(
          "⚠️  Could not clean up test user via API (normal for non-admin request)"
        );
      }
    } catch (cleanupError) {
      console.log("⚠️  Could not clean up test user");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
};

testSimpleFlow();
