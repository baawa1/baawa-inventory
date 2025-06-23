#!/usr/bin/env node

const { dbService } = require("../src/lib/db-service.ts");
const crypto = require("crypto");

async function testPasswordReset() {
  console.log("🔧 Testing Password Reset Flow...\n");

  try {
    // Test 1: Find a test user
    console.log("1. Finding test user...");
    const testUser = await dbService.user.findUnique({
      where: { email: "admin@test.com" },
    });

    if (!testUser) {
      console.log("❌ Test user not found. Creating one...");
      const newUser = await dbService.user.create({
        data: {
          firstName: "Test",
          lastName: "Admin",
          email: "admin@test.com",
          password: "TestPassword123!",
          role: "ADMIN",
        },
      });
      console.log("✅ Test user created:", newUser.email);
    } else {
      console.log("✅ Test user found:", testUser.email);
    }

    // Test 2: Generate reset token
    console.log("\n2. Generating reset token...");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log(
      "✅ Reset token generated:",
      resetToken.substring(0, 16) + "..."
    );

    // Test 3: Update user with reset token
    console.log("\n3. Updating user with reset token...");
    const updatedUser = await dbService.user.update({
      where: { email: "admin@test.com" },
      data: {
        resetToken: resetToken,
        resetTokenExpires: resetTokenExpiry,
        updatedAt: new Date(),
      },
    });

    console.log("✅ User updated with reset token");
    console.log("   - Reset token set:", !!updatedUser.resetToken);
    console.log("   - Expires at:", updatedUser.resetTokenExpires);

    // Test 4: Find user by reset token
    console.log("\n4. Finding user by reset token...");
    const userByToken = await dbService.user.findFirst({
      where: {
        resetToken: resetToken,
        resetTokenExpires: {
          gt: new Date(),
        },
        isActive: true,
      },
    });

    if (userByToken) {
      console.log("✅ User found by reset token:", userByToken.email);
    } else {
      console.log("❌ User not found by reset token");
    }

    // Test 5: Reset password
    console.log("\n5. Resetting password...");
    const bcrypt = require("bcryptjs");
    const newHashedPassword = await bcrypt.hash("NewPassword123!", 12);

    const passwordResetUser = await dbService.user.update({
      where: { id: userByToken.id },
      data: {
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Password reset successfully");
    console.log("   - Reset token cleared:", !passwordResetUser.resetToken);
    console.log("   - Password updated:", !!passwordResetUser.password);

    console.log("\n🎉 Password Reset Flow Test PASSED!");
  } catch (error) {
    console.error("❌ Password Reset Flow Test FAILED:");
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  }
}

// Run the test
testPasswordReset().catch(console.error);
