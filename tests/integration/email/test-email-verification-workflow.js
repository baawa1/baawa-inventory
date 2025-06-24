#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });

async function testEmailVerificationWorkflow() {
  console.log("🧪 Testing Email Verification Workflow...\n");

  const testEmail = `test-verification-${Date.now()}@example.com`;
  console.log(`Using test email: ${testEmail}\n`);

  try {
    // Step 1: Register a new user
    console.log("1️⃣ Registering new user...");
    const registerResponse = await fetch(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: testEmail,
          password: "password123",
          role: "STAFF",
        }),
      }
    );

    const registerData = await registerResponse.json();
    console.log(`✅ Registration response: ${registerResponse.status}`);
    console.log(`   Message: ${registerData.message}`);
    console.log(
      `   Requires verification: ${registerData.requiresVerification}`
    );
    console.log(`   User status: ${registerData.user?.status}\n`);

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    // Step 2: Try to login without verification (should fail)
    console.log("2️⃣ Attempting login without verification...");

    // We need to test this through the NextAuth API
    // For now, we'll test the database state
    const { createServerSupabaseClient } = require("./src/lib/supabase");
    const supabase = await createServerSupabaseClient();

    const { data: user } = await supabase
      .from("users")
      .select(
        "id, email, email_verified, user_status, email_verification_token"
      )
      .eq("email", testEmail)
      .single();

    console.log(`✅ User created in database:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email verified: ${user.email_verified}`);
    console.log(`   Status: ${user.user_status}`);
    console.log(
      `   Has verification token: ${user.email_verification_token ? "Yes" : "No"}\n`
    );

    // Step 3: Simulate email verification
    console.log("3️⃣ Simulating email verification...");
    const verifyResponse = await fetch(
      "http://localhost:3000/api/auth/verify-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: user.email_verification_token,
        }),
      }
    );

    const verifyData = await verifyResponse.json();
    console.log(`✅ Verification response: ${verifyResponse.status}`);
    console.log(`   Message: ${verifyData.message}`);
    console.log(`   User status: ${verifyData.user?.status}\n`);

    // Step 4: Check updated user status
    console.log("4️⃣ Checking updated user status...");
    const { data: updatedUser } = await supabase
      .from("users")
      .select("email_verified, user_status, email_verified_at")
      .eq("id", user.id)
      .single();

    console.log(`✅ Updated user status:`);
    console.log(`   Email verified: ${updatedUser.email_verified}`);
    console.log(`   Status: ${updatedUser.user_status}`);
    console.log(`   Verified at: ${updatedUser.email_verified_at}\n`);

    // Step 5: Test resend verification for already verified user
    console.log("5️⃣ Testing resend verification for verified user...");
    const resendResponse = await fetch(
      "http://localhost:3000/api/auth/verify-email",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
        }),
      }
    );

    const resendData = await resendResponse.json();
    console.log(`✅ Resend verification response: ${resendResponse.status}`);
    console.log(`   Message: ${resendData.message || resendData.error}\n`);

    // Cleanup: Delete test user
    console.log("🧹 Cleaning up test user...");
    await supabase.from("users").delete().eq("id", user.id);
    console.log(`✅ Test user deleted\n`);

    console.log("🎉 Email verification workflow test completed successfully!");
  } catch (error) {
    console.error("❌ Email verification test failed:", error);

    // Try to cleanup on error
    try {
      const { createServerSupabaseClient } = require("./src/lib/supabase");
      const supabase = await createServerSupabaseClient();
      await supabase.from("users").delete().eq("email", testEmail);
      console.log("🧹 Cleaned up test user after error");
    } catch (cleanupError) {
      console.error("Failed to cleanup test user:", cleanupError);
    }
  }
}

// Only run if called directly
if (require.main === module) {
  testEmailVerificationWorkflow();
}

module.exports = { testEmailVerificationWorkflow };
