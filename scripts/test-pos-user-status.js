#!/usr/bin/env node

/**
 * Test POS Product Search API
 * Check if the API endpoints are working correctly
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserStatus() {
  console.log("🔍 Checking User Status for POS Access...\n");

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true, // This is the correct field name
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`📊 Found ${users.length} recent users:\n`);

    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   User Status: ${user.userStatus}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt}`);

      // Check POS access eligibility with correct field
      const hasValidRole = ["ADMIN", "MANAGER", "STAFF"].includes(
        user.role || ""
      );
      const isApproved = user.userStatus === "APPROVED";
      const canAccessPOS = hasValidRole && isApproved;

      console.log(
        `   🎯 POS Access: ${canAccessPOS ? "✅ ALLOWED" : "❌ DENIED"}`
      );

      if (!canAccessPOS) {
        const reasons = [];
        if (!hasValidRole) reasons.push(`Invalid role: ${user.role}`);
        if (!isApproved)
          reasons.push(`Status not approved: ${user.userStatus}`);
        console.log(`   🚫 Reasons: ${reasons.join(", ")}`);
      }

      console.log("");
    });

    // Check for any APPROVED users
    const approvedUsers = await prisma.user.count({
      where: {
        userStatus: "APPROVED",
        role: {
          in: ["ADMIN", "MANAGER", "STAFF"],
        },
      },
    });

    console.log(`✅ POS-eligible users (APPROVED): ${approvedUsers}`);

    if (approvedUsers === 0) {
      console.log("\n⚠️  NO USERS CAN ACCESS POS!");
      console.log("🔧 Solutions:");
      console.log('1. Update user status to "APPROVED"');
      console.log("2. Update user role to ADMIN, MANAGER, or STAFF");
      console.log("3. Check admin approval process");

      // Check if there are users that just need approval
      const needsApproval = await prisma.user.count({
        where: {
          userStatus: "VERIFIED",
          role: {
            in: ["ADMIN", "MANAGER", "STAFF"],
          },
        },
      });

      if (needsApproval > 0) {
        console.log(
          `\n💡 ${needsApproval} user(s) are VERIFIED and need admin approval`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error checking user status:", error);
  }
}

async function approveTestUser() {
  console.log("\n🔧 Attempting to approve a test user for POS access...\n");

  try {
    // Find a user with a valid role that's not already approved
    const user = await prisma.user.findFirst({
      where: {
        role: {
          in: ["ADMIN", "MANAGER", "STAFF"],
        },
        userStatus: {
          not: "APPROVED",
        },
      },
    });

    if (!user) {
      console.log("❌ No eligible users found to approve");
      return;
    }

    // Approve the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        userStatus: "APPROVED",
        isActive: true,
        emailVerified: true,
      },
    });

    console.log(`✅ Approved user: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.userStatus} -> APPROVED`);
    console.log(`   This user should now be able to access POS`);
  } catch (error) {
    console.error("❌ Error approving user:", error);
  }
}

async function main() {
  console.log("🚀 POS User Status Debug Tool");
  console.log("📡 Using Database via Prisma\n");

  await checkUserStatus();

  // Check if user wants to approve a test user
  if (process.argv.includes("approve-user")) {
    await approveTestUser();
    console.log("\n🔄 Checking users again after approval...");
    await checkUserStatus();
  }

  console.log("\n🔄 Next Steps:");
  console.log("1. Login with an APPROVED ADMIN/MANAGER/STAFF user");
  console.log("2. Navigate to /pos");
  console.log("3. Try searching for 'iphone' or other products");
  console.log(
    "4. If no users are approved, run: node scripts/test-pos-user-status.js approve-user"
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
