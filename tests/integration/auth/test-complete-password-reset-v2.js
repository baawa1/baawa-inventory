const { dbService } = require("../src/lib/db-service");

async function testPasswordResetFlow() {
  console.log("🧪 Testing Password Reset Flow with Database Service");
  
  try {
    // Step 1: Create a test user
    console.log("\n1. Creating test user...");
    
    const testUser = await dbService.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        email: "test.reset@example.com",
        password: "OldPassword123",
        role: "STAFF",
        isActive: true,
      },
    });
    
    console.log("✅ Test user created:", {
      id: testUser.id,
      email: testUser.email,
      firstName: testUser.firstName,
    });
    
    // Step 2: Simulate forgot password (set reset token)
    console.log("\n2. Simulating forgot password request...");
    
    const resetToken = "test-reset-token-12345";
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    const userWithToken = await dbService.user.update({
      where: { id: testUser.id },
      data: {
        resetToken: resetToken,
        resetTokenExpires: resetTokenExpiry,
      },
    });
    
    console.log("✅ Reset token set:", {
      resetToken: userWithToken.resetToken,
      resetTokenExpires: userWithToken.resetTokenExpires,
    });
    
    // Step 3: Validate reset token
    console.log("\n3. Validating reset token...");
    
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
      console.log("✅ Reset token is valid for user:", userByToken.email);
    } else {
      console.log("❌ Reset token validation failed");
      return;
    }
    
    // Step 4: Reset password
    console.log("\n4. Resetting password...");
    
    const newPassword = "NewPassword456";
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updatedUser = await dbService.user.update({
      where: { id: userByToken.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      },
    });
    
    console.log("✅ Password reset successfully:", {
      resetToken: updatedUser.resetToken, // Should be null
      resetTokenExpires: updatedUser.resetTokenExpires, // Should be null
      passwordChanged: updatedUser.password !== testUser.password,
    });
    
    // Step 5: Verify old token is no longer valid
    console.log("\n5. Verifying old token is invalid...");
    
    const invalidTokenUser = await dbService.user.findFirst({
      where: {
        resetToken: resetToken,
        resetTokenExpires: {
          gt: new Date(),
        },
        isActive: true,
      },
    });
    
    if (!invalidTokenUser) {
      console.log("✅ Old reset token is correctly invalidated");
    } else {
      console.log("❌ Old reset token is still valid (this is a problem)");
    }
    
    // Step 6: Verify password was changed
    console.log("\n6. Verifying password was changed...");
    
    const finalUser = await dbService.user.findUnique({
      where: { id: testUser.id },
    });
    
    const passwordMatches = await bcrypt.compare(newPassword, finalUser.password);
    
    if (passwordMatches) {
      console.log("✅ New password is correctly set");
    } else {
      console.log("❌ New password is not set correctly");
    }
    
    console.log("\n🎉 Password reset flow test completed successfully!");
    
  } catch (error) {
    console.error("❌ Password reset flow test failed:", error.message);
    console.error("Full error:", error);
  }
}

testPasswordResetFlow();
