#!/usr/bin/env node
/**
 * Test script to verify POS access control logic
 * This script simulates the session logic to test if users can access POS
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mock session object structure (similar to NextAuth)
function createMockSession(user) {
  return {
    user: {
      id: user.id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.userStatus || "PENDING",
      emailVerified: user.emailVerified,
    },
  };
}

// Simulate POS access control logic
function checkPOSAccess(session) {
  // Check if user is logged in
  if (!session) {
    return { access: false, redirect: "/login", reason: "Not logged in" };
  }

  // Check if user is active and approved
  if (!["APPROVED", "VERIFIED"].includes(session.user.status)) {
    return {
      access: false,
      redirect: "/pending-approval",
      reason: `Status is ${session.user.status}`,
    };
  }

  // POS access requires at least Staff role
  if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role || "")) {
    return {
      access: false,
      redirect: "/unauthorized",
      reason: `Role is ${session.user.role}`,
    };
  }

  return { access: true, redirect: null, reason: "Access granted" };
}

async function testPOSAccess() {
  try {
    console.log("🧪 Testing POS Access Control Logic");
    console.log("=" * 50);

    // Get a few sample users to test
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true,
        isActive: true,
        emailVerified: true,
      },
      take: 10,
    });

    console.log(`Testing ${users.length} users for POS access:\n`);

    let accessGranted = 0;
    let accessDenied = 0;

    for (const user of users) {
      const session = createMockSession(user);
      const result = checkPOSAccess(session);

      const status = result.access ? "✅ GRANTED" : "❌ DENIED";
      console.log(
        `${status} | ${user.email} | ${user.role} | ${user.userStatus}`
      );

      if (!result.access) {
        console.log(`    → ${result.reason} (redirect to ${result.redirect})`);
      }

      if (result.access) {
        accessGranted++;
      } else {
        accessDenied++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Access Granted: ${accessGranted} users`);
    console.log(`   Access Denied: ${accessDenied} users`);

    if (accessGranted === 0) {
      console.log(`\n⚠️  WARNING: No users have access to POS!`);
    } else {
      console.log(`\n✅ SUCCESS: ${accessGranted} users can access POS.`);
    }

    // Test specific scenarios
    console.log(`\n🔍 Testing specific scenarios:`);

    // Test unauthenticated access
    const unauthResult = checkPOSAccess(null);
    console.log(
      `   Unauthenticated: ${unauthResult.access ? "✅ GRANTED" : "❌ DENIED"} - ${unauthResult.reason}`
    );

    // Test user with PENDING status
    const pendingUser = users.find((u) => u.userStatus === "PENDING");
    if (pendingUser) {
      const pendingSession = createMockSession(pendingUser);
      const pendingResult = checkPOSAccess(pendingSession);
      console.log(
        `   Pending Status: ${pendingResult.access ? "✅ GRANTED" : "❌ DENIED"} - ${pendingResult.reason}`
      );
    }

    // Test user with EMPLOYEE role (should be denied)
    const employeeUser = users.find((u) => u.role === "EMPLOYEE");
    if (employeeUser) {
      const employeeSession = createMockSession(employeeUser);
      const employeeResult = checkPOSAccess(employeeSession);
      console.log(
        `   Employee Role: ${employeeResult.access ? "✅ GRANTED" : "❌ DENIED"} - ${employeeResult.reason}`
      );
    }
  } catch (error) {
    console.error("❌ Error testing POS access:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPOSAccess();
