#!/usr/bin/env node

/**
 * Debug User Status for POS Access
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
        status: true,
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
      console.log(`   Status: ${user.status || "NULL"}`);
      console.log(`   Last Login: ${user.lastLogin || "Never"}`);
      console.log(`   Created: ${user.createdAt}`);

      // Check POS access eligibility
      const hasValidRole = ["ADMIN", "MANAGER", "STAFF"].includes(
        user.role || ""
      );
      const isActiveStatus = user.status === "active";
      const canAccessPOS = hasValidRole && isActiveStatus;

      console.log(
        `   🎯 POS Access: ${canAccessPOS ? "✅ ALLOWED" : "❌ DENIED"}`
      );

      if (!canAccessPOS) {
        const reasons = [];
        if (!hasValidRole) reasons.push(`Invalid role: ${user.role}`);
        if (!isActiveStatus) reasons.push(`Status not active: ${user.status}`);
        console.log(`   🚫 Reasons: ${reasons.join(", ")}`);
      }

      console.log("");
    });

    // Summary
    const activeUsers = users.filter((u) => u.status === "active");
    const posEligibleUsers = users.filter(
      (u) =>
        ["ADMIN", "MANAGER", "STAFF"].includes(u.role || "") &&
        u.status === "active"
    );

    console.log("📈 Summary:");
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Active Users: ${activeUsers.length}`);
    console.log(`   POS Eligible Users: ${posEligibleUsers.length}`);

    if (posEligibleUsers.length === 0) {
      console.log("\n⚠️  NO USERS CAN ACCESS POS!");
      console.log("🔧 Solutions:");
      console.log('1. Update user status to "active"');
      console.log("2. Update user role to ADMIN, MANAGER, or STAFF");
      console.log("3. Check user approval process");
    }
  } catch (error) {
    console.error("❌ Error checking user statuses:", error);
  }
}

async function fixUserStatuses() {
  console.log("\n🔧 Attempting to fix user statuses...\n");

  try {
    // Get all users that should have active status
    const usersToUpdate = await prisma.user.findMany({
      where: {
        OR: [{ status: null }, { status: { not: "active" } }],
        role: {
          in: ["ADMIN", "MANAGER", "STAFF"],
        },
      },
    });

    console.log(
      `Found ${usersToUpdate.length} users that need status updates:`
    );

    for (const user of usersToUpdate) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "active",
          emailVerified: true,
          isActive: true,
        },
      });

      console.log(
        `✅ Updated ${user.email}: status -> active, emailVerified -> true`
      );
    }

    if (usersToUpdate.length === 0) {
      console.log("✅ All eligible users already have correct status");
    }
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
        status: "active",
      },
    });

    if (adminUser) {
      console.log(`✅ Active admin user exists: ${adminUser.email}`);
      return;
    }

    console.log("🔧 No active admin user found. Options:");
    console.log("1. Update existing user to ADMIN role and active status");
    console.log("2. Create new admin user via registration");
    console.log("3. Update user status manually in database");

    // Check if any users exist at all
    const anyUser = await prisma.user.findFirst();
    if (anyUser) {
      console.log(`\n💡 Suggestion: Update user ${anyUser.email} to admin:`);
      console.log(`   Role: ${anyUser.role} -> ADMIN`);
      console.log(`   Status: ${anyUser.status} -> active`);
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

  console.log("\n🔄 Next Steps:");
  console.log("1. Check user statuses above");
  console.log("2. Login with an active ADMIN/MANAGER/STAFF user");
  console.log("3. Navigate to /pos");
  console.log("4. If still redirecting, check NextAuth session data");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
