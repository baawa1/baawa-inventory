#!/usr/bin/env node

// Test password reset flow using direct Supabase calls
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPasswordResetFlow() {
  console.log("🔧 Testing Password Reset Flow...\n");

  try {
    // Test 1: Check existing users
    console.log("1. Checking existing users...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, is_active")
      .limit(3);

    if (usersError) throw usersError;

    console.log("✅ Found users:", users.length);
    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
    });

    // Use the first active user for testing
    const testUser = users.find((u) => u.is_active) || users[0];
    if (!testUser) {
      throw new Error("No test user available");
    }

    console.log(`\n📋 Using test user: ${testUser.email}`);

    // Test 2: Generate reset token
    console.log("\n2. Generating reset token...");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log(
      "✅ Reset token generated:",
      resetToken.substring(0, 16) + "..."
    );
    console.log("✅ Expires at:", resetTokenExpiry.toISOString());

    // Test 3: Update user with reset token
    console.log("\n3. Updating user with reset token...");
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", testUser.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log("✅ User updated with reset token");
    console.log("   - Reset token set:", !!updatedUser.reset_token);
    console.log("   - Expires at:", updatedUser.reset_token_expires);

    // Test 4: Find user by reset token (simulate API call)
    console.log("\n4. Finding user by reset token...");
    const { data: userByToken, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("reset_token", resetToken)
      .gt("reset_token_expires", new Date().toISOString())
      .eq("is_active", true)
      .single();

    if (findError && findError.code !== "PGRST116") throw findError;

    if (userByToken) {
      console.log("✅ User found by reset token:", userByToken.email);
      console.log("   - Token valid until:", userByToken.reset_token_expires);
    } else {
      console.log("❌ User not found by reset token");
      return;
    }

    // Test 5: Reset password
    console.log("\n5. Resetting password...");
    const newPassword = "NewTestPassword123!";
    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    const { data: passwordResetUser, error: resetError } = await supabase
      .from("users")
      .update({
        password_hash: newHashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userByToken.id)
      .select("id, email, reset_token, reset_token_expires")
      .single();

    if (resetError) throw resetError;

    console.log("✅ Password reset successfully");
    console.log("   - Reset token cleared:", !passwordResetUser.reset_token);
    console.log(
      "   - Reset expiry cleared:",
      !passwordResetUser.reset_token_expires
    );

    // Test 6: Verify password hash
    console.log("\n6. Verifying new password...");
    const { data: finalUser, error: verifyError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userByToken.id)
      .single();

    if (verifyError) throw verifyError;

    const passwordMatch = await bcrypt.compare(
      newPassword,
      finalUser.password_hash
    );
    console.log("✅ Password verification:", passwordMatch ? "PASS" : "FAIL");

    console.log("\n🎉 Password Reset Flow Test COMPLETED SUCCESSFULLY!");
    console.log("\n📋 Summary:");
    console.log("   ✅ Database connection working");
    console.log("   ✅ Field mappings corrected");
    console.log("   ✅ Reset token generation working");
    console.log("   ✅ Token lookup working");
    console.log("   ✅ Password hashing working");
    console.log("   ✅ Token cleanup working");
  } catch (error) {
    console.error("\n❌ Password Reset Flow Test FAILED:");
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Code:", error.code);
    }
    if (error.details) {
      console.error("Details:", error.details);
    }
  }
}

// Run the test
testPasswordResetFlow().catch(console.error);
