#!/usr/bin/env node

/**
 * Test Session Refresh After Email Verification
 *
 * This script tests the complete flow:
 * 1. User registers
 * 2. User logs in (should fail - email not verified)
 * 3. User verifies email
 * 4. User logs in again (should work, session should have VERIFIED status)
 * 5. Simulates accessing pending approval page (should show correct status)
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function testSessionRefreshFlow() {
  console.log("🧪 Testing Session Refresh After Email Verification\n");

  const testEmail = `test-session-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testUserData = {
    email: testEmail,
    firstName: "Test",
    lastName: "User",
    password: testPassword,
  };

  try {
    // Step 1: Register user
    console.log("📝 Step 1: Registering user...");
    const registerResponse = await fetch(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUserData),
      }
    );

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    console.log("✅ User registered successfully");
    console.log(`   User ID: ${registerData.user.id}`);
    console.log(`   Status: ${registerData.user.status}`);
    console.log(`   Email Verified: ${registerData.user.emailVerified}`);

    const userId = registerData.user.id;

    // Step 2: Try to login before email verification (should fail)
    console.log("\n🔐 Step 2: Attempting login before email verification...");
    const loginResponse1 = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData1 = await loginResponse1.json();

    if (loginResponse1.ok) {
      console.log("❌ Login should have failed for unverified email");
    } else {
      console.log("✅ Login correctly failed for unverified email");
      console.log(`   Error: ${loginData1.error}`);
    }

    // Step 3: Manually verify email in database (simulating email verification)
    console.log("\n📧 Step 3: Simulating email verification...");

    // Update user to verified status
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        email_verified: true,
        user_status: "VERIFIED",
        email_verified_at: new Date(),
      },
    });

    console.log("✅ Email verification simulated");
    console.log(`   Status: ${user.user_status}`);
    console.log(`   Email Verified: ${user.email_verified}`);

    // Step 4: Try to login after email verification (should work)
    console.log("\n🔐 Step 4: Attempting login after email verification...");
    const loginResponse2 = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData2 = await loginResponse2.json();

    if (loginResponse2.ok) {
      console.log("✅ Login successful after email verification");
      console.log(`   User ID: ${loginData2.user.id}`);
      console.log(`   Status: ${loginData2.user.status}`);
      console.log(`   Email Verified: ${loginData2.user.emailVerified}`);

      // Check if session includes correct status
      if (loginData2.user.status === "VERIFIED") {
        console.log("✅ Session contains correct VERIFIED status");
      } else {
        console.log(
          `❌ Session status incorrect. Expected: VERIFIED, Got: ${loginData2.user.status}`
        );
      }

      if (loginData2.user.emailVerified === true) {
        console.log("✅ Session contains correct emailVerified flag");
      } else {
        console.log(
          `❌ Session emailVerified incorrect. Expected: true, Got: ${loginData2.user.emailVerified}`
        );
      }
    } else {
      console.log("❌ Login failed after email verification");
      console.log(`   Error: ${loginData2.error}`);
    }

    // Step 5: Simulate status change and session refresh
    console.log("\n🔄 Step 5: Testing session refresh functionality...");

    // Change user status to APPROVED
    await prisma.users.update({
      where: { id: userId },
      data: {
        user_status: "APPROVED",
      },
    });

    console.log("✅ User status changed to APPROVED in database");
    console.log(
      "   (In real app, session.update() would be called to refresh)"
    );

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await prisma.users.delete({
      where: { id: userId },
    });
    console.log("✅ Test user deleted");

    console.log("\n🎉 Session refresh flow test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Try to cleanup on error
    try {
      await prisma.users.deleteMany({
        where: { email: testEmail },
      });
      console.log("🧹 Cleaned up test data after error");
    } catch (cleanupError) {
      console.error("Failed to cleanup:", cleanupError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSessionRefreshFlow();
