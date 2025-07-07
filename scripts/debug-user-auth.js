const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugUserAuth() {
  try {
    console.log("🔍 Checking user authentication status...\n");

    // Get all users with their current status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        userStatus: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${users.length} users in the system:\n`);

    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
      );
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.userStatus}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Can access POS: ${canAccessPOS(user)}`);
      console.log("");
    });

    // Check for any test users
    const testUsers = users.filter(
      (user) =>
        user.email.includes("test") ||
        user.email.includes("admin") ||
        user.email.includes("manager") ||
        user.email.includes("staff")
    );

    if (testUsers.length > 0) {
      console.log("🧪 Test users found:");
      testUsers.forEach((user) => {
        console.log(`   ${user.email} - ${user.role} - ${user.userStatus}`);
      });
    }
  } catch (error) {
    console.error("❌ Error checking user auth:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function canAccessPOS(user) {
  // Updated POS access requirements (fixed middleware logic)
  const hasValidRole = ["ADMIN", "MANAGER", "STAFF"].includes(user.role);
  const hasValidStatus = user.userStatus === "APPROVED"; // Only APPROVED users
  const isActive = user.isActive;
  // Email verification is NOT required for APPROVED users

  return hasValidRole && hasValidStatus && isActive;
}

// Run the debug
debugUserAuth();
