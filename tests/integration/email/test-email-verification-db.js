#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function testEmailVerificationFields() {
  console.log("🧪 Testing Email Verification Database Fields...\n");

  try {
    // Test reading existing users with new fields
    console.log("📋 Testing existing users with new fields...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        emailVerificationToken: true,
        emailVerificationExpires: true,
        userStatus: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
        emailNotifications: true,
        marketingEmails: true,
      },
      take: 3,
    });

    console.log(`✅ Found ${users.length} users with new fields:`);
    users.forEach((user) => {
      console.log(
        `   - ${user.email}: status=${user.userStatus}, verified=${user.emailVerified}`
      );
    });

    // Test creating a new user with email verification fields
    console.log("\n🆕 Testing new user creation with email verification...");
    const testEmail = `test-verification-${Date.now()}@example.com`;

    const newUser = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        email: testEmail,
        password: "hashedpassword123",
        role: "STAFF",
        userStatus: "PENDING",
        emailVerified: false,
        emailVerificationToken: `verify_${Math.random().toString(36).substring(7)}`,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        emailNotifications: true,
        marketingEmails: false,
      },
    });

    console.log("✅ Created new user with email verification fields:");
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Status: ${newUser.userStatus}`);
    console.log(`   - Email Verified: ${newUser.emailVerified}`);
    console.log(
      `   - Verification Token: ${newUser.emailVerificationToken ? "Set" : "Not Set"}`
    );
    console.log(`   - Token Expires: ${newUser.emailVerificationExpires}`);

    // Test updating user status (simulating email verification)
    console.log("\n🔄 Testing email verification status update...");
    const verifiedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
        userStatus: "VERIFIED",
      },
    });

    console.log("✅ Updated user verification status:");
    console.log(`   - Email Verified: ${verifiedUser.emailVerified}`);
    console.log(`   - Verified At: ${verifiedUser.emailVerifiedAt}`);
    console.log(`   - Status: ${verifiedUser.userStatus}`);

    // Test user approval (simulating admin approval)
    console.log("\n👨‍💼 Testing admin approval workflow...");

    // Get first admin user for approval
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminUser) {
      const approvedUser = await prisma.user.update({
        where: { id: newUser.id },
        data: {
          userStatus: "APPROVED",
          approvedBy: adminUser.id,
          approvedAt: new Date(),
        },
      });

      console.log("✅ Updated user approval status:");
      console.log(`   - Status: ${approvedUser.userStatus}`);
      console.log(`   - Approved By: ${approvedUser.approvedBy}`);
      console.log(`   - Approved At: ${approvedUser.approvedAt}`);
    } else {
      console.log("⚠️  No admin user found for approval test");
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: newUser.id },
    });
    console.log("🧹 Cleaned up test user");

    // Test enum values
    console.log("\n📊 Testing UserStatus enum values...");
    const statusCounts = await prisma.$queryRaw`
      SELECT user_status, COUNT(*) as count 
      FROM users 
      GROUP BY user_status 
      ORDER BY user_status
    `;

    console.log("✅ User status distribution:");
    statusCounts.forEach((row) => {
      console.log(`   - ${row.user_status}: ${row.count} users`);
    });

    console.log("\n🎉 All email verification database tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testEmailVerificationFields();
