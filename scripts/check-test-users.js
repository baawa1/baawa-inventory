const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function checkTestUsers() {
  try {
    console.log("🔍 Checking test users in database...\n");

    // Check for the specific test email being used
    const testEmail = "baawapay+test5@gmail.com";
    const testUser = await prisma.user.findFirst({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (testUser) {
      console.log("✅ Test user found:");
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Status: ${testUser.userStatus}`);
      console.log(`   Email Verified: ${testUser.emailVerified}`);
      console.log(`   Active: ${testUser.isActive}`);
      console.log(`   Created: ${testUser.createdAt}`);
    } else {
      console.log(`❌ Test user not found: ${testEmail}`);
    }

    // Check all users in database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
      },
      take: 10, // Limit to first 10 users
    });

    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log("\n📋 Available users:");
      allUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (${user.role}, ${user.userStatus})`
        );
      });
    }

    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
        emailVerified: true,
        userStatus: "APPROVED",
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (adminUsers.length > 0) {
      console.log("\n👑 Active admin users:");
      adminUsers.forEach((admin, index) => {
        console.log(
          `   ${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`
        );
      });
    } else {
      console.log("\n⚠️  No active admin users found");
    }
  } catch (error) {
    console.error("❌ Error checking users:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUsers();
