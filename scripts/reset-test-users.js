#!/usr/bin/env node

/**
 * Reset Test Users for E2E Tests
 * Creates or resets test users to specific states for consistent e2e testing
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

// Define our test users with their required states
const TEST_USERS = {
  UNVERIFIED: {
    email: "baawapays+test-unverified@gmail.com",
    firstName: "Unverified",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "PENDING",
    emailVerified: false,
    isActive: true,
  },
  VERIFIED_UNAPPROVED: {
    email: "baawapays+test-verified-unapproved@gmail.com",
    firstName: "Verified",
    lastName: "Unapproved",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "VERIFIED",
    emailVerified: true,
    isActive: true,
  },
  APPROVED_ADMIN: {
    email: "baawapays+test-admin@gmail.com",
    firstName: "Admin",
    lastName: "User",
    password: "SecurePassword123!",
    role: "ADMIN",
    userStatus: "APPROVED",
    emailVerified: true,
    isActive: true,
  },
  APPROVED_MANAGER: {
    email: "baawapays+test-manager@gmail.com",
    firstName: "Manager",
    lastName: "User",
    password: "SecurePassword123!",
    role: "MANAGER",
    userStatus: "APPROVED",
    emailVerified: true,
    isActive: true,
  },
  APPROVED_STAFF: {
    email: "baawapays+test-staff@gmail.com",
    firstName: "Staff",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "APPROVED",
    emailVerified: true,
    isActive: true,
  },
  REJECTED: {
    email: "baawapays+test-rejected@gmail.com",
    firstName: "Rejected",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "REJECTED",
    emailVerified: true,
    isActive: false,
  },
  SUSPENDED: {
    email: "baawapays+test-suspended@gmail.com",
    firstName: "Suspended",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "SUSPENDED",
    emailVerified: true,
    isActive: false,
  },
};

async function resetTestUsers() {
  console.log("🔄 Resetting test users for E2E tests...\n");

  try {
    const hashedPassword = await bcrypt.hash("SecurePassword123!", 12);
    let createdCount = 0;
    let updatedCount = 0;

    for (const [userType, userData] of Object.entries(TEST_USERS)) {
      console.log(`📧 Processing ${userType}: ${userData.email}`);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        // Update existing user to match required state
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            role: userData.role,
            userStatus: userData.userStatus,
            emailVerified: userData.emailVerified,
            isActive: userData.isActive,
            emailVerifiedAt: userData.emailVerified ? new Date() : null,
            approvedAt: userData.userStatus === "APPROVED" ? new Date() : null,
            updatedAt: new Date(),
          },
        });
        updatedCount++;
        console.log(`   ✅ Updated existing user`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            role: userData.role,
            userStatus: userData.userStatus,
            emailVerified: userData.emailVerified,
            isActive: userData.isActive,
            emailVerifiedAt: userData.emailVerified ? new Date() : null,
            approvedAt: userData.userStatus === "APPROVED" ? new Date() : null,
          },
        });
        createdCount++;
        console.log(`   ✅ Created new user`);
      }

      console.log(`   👤 ${userData.firstName} ${userData.lastName}`);
      console.log(`   🎭 Role: ${userData.role}`);
      console.log(`   📊 Status: ${userData.userStatus}`);
      console.log(`   ✅ Email Verified: ${userData.emailVerified}`);
      console.log(`   🔑 Password: ${userData.password}`);
      console.log("");
    }

    console.log("🎉 Test user reset complete!");
    console.log(`   📈 Created: ${createdCount} users`);
    console.log(`   🔄 Updated: ${updatedCount} users`);
    console.log(
      `   📊 Total: ${Object.keys(TEST_USERS).length} users ready for testing`
    );

    console.log("\n📋 Test User Summary:");
    for (const [userType, userData] of Object.entries(TEST_USERS)) {
      console.log(
        `   ${userType}: ${userData.email} (${userData.role}/${userData.userStatus})`
      );
    }

    console.log(
      "\n🔗 All users can be logged in with password: SecurePassword123!"
    );
  } catch (error) {
    console.error("❌ Error resetting test users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupTestUsers() {
  console.log("🧹 Cleaning up test users...\n");

  try {
    const testEmails = Object.values(TEST_USERS).map((user) => user.email);

    // Delete related data first
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.auditLog.deleteMany({ where: { user_id: user.id } });
        await prisma.rateLimit.deleteMany({ where: { key: email } });
        await prisma.sessionBlacklist.deleteMany({
          where: { userId: user.id },
        });
      }
    }

    // Delete the users
    const deleteResult = await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });

    console.log(`✅ Deleted ${deleteResult.count} test users and related data`);
  } catch (error) {
    console.error("❌ Error cleaning up test users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "reset":
    case undefined:
      resetTestUsers();
      break;
    case "cleanup":
      cleanupTestUsers();
      break;
    case "help":
      console.log("Usage:");
      console.log("  node scripts/reset-test-users.js [reset|cleanup|help]");
      console.log("");
      console.log("Commands:");
      console.log("  reset    - Create or reset test users (default)");
      console.log("  cleanup  - Delete all test users");
      console.log("  help     - Show this help");
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Run 'node scripts/reset-test-users.js help' for usage");
      process.exit(1);
  }
}

module.exports = { TEST_USERS, resetTestUsers, cleanupTestUsers };
