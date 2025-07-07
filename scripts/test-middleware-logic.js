/**
 * Test script to simulate middleware logic with actual user data
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testMiddlewareLogic() {
  console.log("🔍 Testing middleware logic with actual user data...\n");

  try {
    // Get some test users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: "admin@baawa.com" },
          { email: "baawapay+test14@gmail.com" },
          { email: "test@resend.dev" },
          { email: "baawapay+test3@gmail.com" },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        userStatus: true,
        isActive: true,
        emailVerified: true,
      },
    });

    console.log("Testing middleware logic for each user:\n");

    for (const user of users) {
      console.log(`👤 ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.userStatus}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);

      // Simulate middleware logic
      const result = simulateMiddleware(user);
      console.log(`   🎯 Middleware result: ${result}`);
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function simulateMiddleware(user) {
  const userRole = user.role;
  const userStatus = user.userStatus;
  const emailVerified = user.emailVerified;
  const isActive = user.isActive;
  const pathname = "/pos";

  console.log(`   🔍 Middleware checks:`);

  // Check if user is active
  if (!isActive) {
    console.log(`      ❌ User is not active`);
    return "REDIRECT to /pending-approval (inactive user)";
  }

  // 1. Handle users pending email verification (PENDING status)
  if (userStatus === "PENDING") {
    console.log(`      ❌ User status is PENDING`);
    return "REDIRECT to /verify-email (pending verification)";
  }

  // 2. Handle verified but unapproved users (VERIFIED status)
  if (userStatus === "VERIFIED") {
    console.log(`      ❌ User status is VERIFIED (not approved)`);
    return "REDIRECT to /pending-approval (waiting for approval)";
  }

  // 3. Handle rejected users
  if (userStatus === "REJECTED") {
    console.log(`      ❌ User status is REJECTED`);
    return "REDIRECT to /pending-approval (account rejected)";
  }

  // 4. Handle suspended users
  if (userStatus === "SUSPENDED") {
    console.log(`      ❌ User status is SUSPENDED`);
    return "REDIRECT to /pending-approval (account suspended)";
  }

  // 5. Only approved users can access protected routes
  if (userStatus !== "APPROVED") {
    console.log(`      ❌ User status is ${userStatus} (not approved)`);
    return "REDIRECT to /pending-approval (non-approved user)";
  }

  console.log(`      ✅ User status is APPROVED`);

  // Role-based access control for approved users
  if (pathname.startsWith("/pos")) {
    const allowedRoles = ["ADMIN", "MANAGER", "STAFF"];
    if (!allowedRoles.includes(userRole)) {
      console.log(`      ❌ Role ${userRole} not allowed for POS`);
      return "REDIRECT to /unauthorized (invalid role)";
    }
    console.log(`      ✅ Role ${userRole} allowed for POS`);
  }

  console.log(`      ✅ All checks passed`);
  return "ALLOW access to /pos";
}

testMiddlewareLogic();
