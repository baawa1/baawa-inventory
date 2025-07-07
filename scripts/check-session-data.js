/**
 * Test script to check session data for debugging POS redirect issue
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkSessionData() {
  console.log("🔍 Checking session data for debugging...\n");

  try {
    // Get a test user that should have access
    const testUser = await prisma.user.findFirst({
      where: {
        email: "admin@baawa.com",
        userStatus: "APPROVED",
        isActive: true,
        role: "ADMIN",
      },
    });

    if (!testUser) {
      console.log("❌ No test user found");
      return;
    }

    console.log("✅ Found test user:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Status: ${testUser.userStatus}`);
    console.log(`   Active: ${testUser.isActive}`);
    console.log(`   Email Verified: ${testUser.emailVerified}`);
    console.log(`   ID: ${testUser.id}`);

    console.log("\n📋 What NextAuth session should contain:");
    console.log("   user.id:", testUser.id);
    console.log("   user.email:", testUser.email);
    console.log("   user.name:", `${testUser.firstName} ${testUser.lastName}`);
    console.log("   user.role:", testUser.role);
    console.log("   user.status:", testUser.userStatus);
    console.log("   user.emailVerified:", testUser.emailVerified);

    console.log("\n🔍 Middleware should allow access because:");
    console.log("   ✅ userStatus === 'APPROVED'");
    console.log("   ✅ userRole === 'ADMIN' (in allowed roles)");
    console.log("   ✅ isActive === true");
    console.log("   ✅ emailVerified check is bypassed for APPROVED users");

    console.log("\n🎯 Try logging in with this user:");
    console.log(`   Email: ${testUser.email}`);
    console.log("   Password: password (or whatever you set)");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessionData();
