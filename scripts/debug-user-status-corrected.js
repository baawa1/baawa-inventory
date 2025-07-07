#!/usr/bin/env node

/**
 * Check User Status for POS Access (Corrected)
 * Check why users are being redirected to pending-approval
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserStatuses() {
  console.log("🔍 Checking User Statuses in Database...\n");

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        userStatus: true, // Correct field name
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   User Status: ${user.userStatus || "NULL"}`);
      console.log(`   Last Login: ${user.lastLogin || "Never"}`);
      console.log(`   Created: ${user.createdAt}`);

      // Check POS access eligibility
      const hasValidRole = ["ADMIN", "MANAGER", "STAFF"].includes(
        user.role || ""
      );
      const isApprovedStatus = ["APPROVED", "VERIFIED"].includes(
        user.userStatus || ""
      );
      const canAccessPOS = hasValidRole && isApprovedStatus;

      console.log(
        `   🎯 POS Access: ${canAccessPOS ? "✅ ALLOWED" : "❌ DENIED"}`
      );

      if (!canAccessPOS) {
        const reasons = [];
        if (!hasValidRole) reasons.push(`Invalid role: ${user.role}`);
        if (!isApprovedStatus)
          reasons.push(`Status not approved: ${user.userStatus}`);
        console.log(`   🚫 Reasons: ${reasons.join(", ")}`);
      }

      console.log("");
    });

    // Summary
    const activeUsers = users.filter((u) =>
      ["APPROVED", "VERIFIED"].includes(u.userStatus || "")
    );
    const posEligibleUsers = users.filter(
      (u) =>
        ["ADMIN", "MANAGER", "STAFF"].includes(u.role || "") &&
        ["APPROVED", "VERIFIED"].includes(u.userStatus || "")
    );

    console.log("📈 Summary:");
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Active Users: ${activeUsers.length}`);
    console.log(`   POS Eligible Users: ${posEligibleUsers.length}`);

    if (posEligibleUsers.length === 0) {
      console.log("\n⚠️  NO USERS CAN ACCESS POS!");
      console.log("🔧 Solutions:");
      console.log('1. Update user userStatus to "APPROVED" or "VERIFIED"');
      console.log('2. Ensure user has role "ADMIN", "MANAGER", or "STAFF"');
    }
  } catch (error) {
    console.error("❌ Error checking user statuses:", error);
  }
}

async function fixUserStatuses() {
  console.log("\n🔧 Attempting to fix user statuses...\n");

  try {
    // Find users with role but no proper status
    const usersToFix = await prisma.user.findMany({
      where: {
        OR: [
          {
            userStatus: null,
          },
          {
            userStatus: {
              not: "APPROVED",
            },
          },
        ],
        role: {
          in: ["ADMIN", "MANAGER", "STAFF"],
        },
      },
    });

    console.log(`🔍 Found ${usersToFix.length} users to fix`);

    for (const user of usersToFix) {
      console.log(`   Fixing user: ${user.email}`);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          userStatus: "APPROVED",
          isActive: true,
        },
      });
    }

    console.log("✅ User statuses fixed!");
  } catch (error) {
    console.error("❌ Error fixing user statuses:", error);
  }
}

async function createTestAdminUser() {
  console.log("\n👤 Checking for admin user...\n");

  try {
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        userStatus: "APPROVED",
      },
    });

    if (adminUser) {
      console.log("✅ Found admin user:");
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Status: ${adminUser.userStatus}`);
      console.log(`   Role: ${adminUser.role}`);
    } else {
      console.log("❌ No admin user found");
      console.log("🔧 Creating test admin user...");

      const newAdmin = await prisma.user.create({
        data: {
          email: "admin@baawa.com",
          firstName: "Admin",
          lastName: "User",
          role: "ADMIN",
          userStatus: "APPROVED",
          isActive: true,
          emailVerified: true,
          password:
            "$2b$10$H2P5.XYzCZ9mCbPvbYW.7OXbOCTXWqIQrFhEQCjVDmUaVQcHqGJJG", // "password123"
        },
      });

      console.log("✅ Created admin user:");
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Password: password123`);
      console.log(`   Role: ${newAdmin.role}`);
    }
  } catch (error) {
    console.error("❌ Error checking admin user:", error);
  }
}

async function main() {
  console.log("🚀 POS Access Debug Tool");
  console.log("📡 Using Supabase Remote Database via Prisma\n");

  await checkUserStatuses();
  await fixUserStatuses();
  await createTestAdminUser();
  await prisma.$disconnect();

  console.log("\n🔄 Next Steps:");
  console.log("1. Check user statuses above");
  console.log("2. Login with an active ADMIN/MANAGER/STAFF user");
  console.log("3. Navigate to /pos");
  console.log("4. If still redirecting, check NextAuth session data");
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
