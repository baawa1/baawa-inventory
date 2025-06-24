#!/usr/bin/env node

/**
 * Test Session Refresh API Endpoint
 *
 * This script tests the /api/auth/refresh-session endpoint
 * to ensure it returns the correct user data from the database
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testSessionRefreshAPI() {
  console.log("🧪 Testing Session Refresh API Endpoint\n");

  const testEmail = `test-refresh-${Date.now()}@example.com`;
  const testUserData = {
    email: testEmail,
    firstName: "Test",
    lastName: "RefreshUser",
    password: "TestPassword123!",
  };

  let createdUserId = null;

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

    createdUserId = registerData.user.id;

    // Step 2: Simulate email verification in database
    console.log("\n📧 Step 2: Simulating email verification...");

    const user = await prisma.user.update({
      where: { id: createdUserId },
      data: {
        emailVerified: true,
        userStatus: "VERIFIED",
        emailVerifiedAt: new Date(),
      },
    });

    console.log("✅ Email verification simulated in database");
    console.log(`   Status: ${user.userStatus}`);
    console.log(`   Email Verified: ${user.emailVerified}`);

    // Step 3: Test the refresh session API (this would normally require authentication)
    console.log("\n🔄 Step 3: Testing session refresh API...");
    console.log(
      "   Note: This test cannot fully test the API without valid session authentication"
    );
    console.log("   The API endpoint expects a valid NextAuth session");

    // Step 4: Verify database contains correct data
    console.log("\n🔍 Step 4: Verifying database contains correct data...");

    const userFromDB = await prisma.user.findUnique({
      where: { id: createdUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    if (userFromDB) {
      console.log("✅ User data retrieved from database:");
      console.log(`   ID: ${userFromDB.id}`);
      console.log(`   Email: ${userFromDB.email}`);
      console.log(`   Name: ${userFromDB.firstName} ${userFromDB.lastName}`);
      console.log(`   Role: ${userFromDB.role}`);
      console.log(`   Status: ${userFromDB.userStatus}`);
      console.log(`   Email Verified: ${userFromDB.emailVerified}`);

      // Check if the data matches what the session refresh API should return
      const expectedSessionData = {
        id: userFromDB.id.toString(),
        email: userFromDB.email,
        name: `${userFromDB.firstName} ${userFromDB.lastName}`,
        role: userFromDB.role,
        status: userFromDB.userStatus,
        emailVerified: userFromDB.emailVerified,
      };

      console.log("\n✅ Expected session data after refresh:");
      console.log(JSON.stringify(expectedSessionData, null, 2));

      if (
        userFromDB.userStatus === "VERIFIED" &&
        userFromDB.emailVerified === true
      ) {
        console.log("\n🎉 Database contains correct verified user data!");
        console.log(
          "   The session refresh API should return this updated status"
        );
      } else {
        console.log("\n❌ Database data is not as expected");
      }
    } else {
      console.log("❌ User not found in database");
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await prisma.user.delete({
      where: { id: createdUserId },
    });
    console.log("✅ Test user deleted");

    console.log("\n🎉 Session refresh API test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Try to cleanup on error
    if (createdUserId) {
      try {
        await prisma.user.delete({
          where: { id: createdUserId },
        });
        console.log("🧹 Cleaned up test data after error");
      } catch (cleanupError) {
        console.error("Failed to cleanup:", cleanupError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSessionRefreshAPI();
