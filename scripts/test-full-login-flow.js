#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://bhwywfigcyotkxbujivm.supabase.co",
  "***REMOVED***"
);

async function testFullLoginFlow() {
  try {
    console.log("🧪 Testing Full Login Flow for VERIFIED users\n");

    const testEmail = "baawapay+verified-test@gmail.com";
    const testPassword = "password123";

    // First verify the user exists and has correct status
    console.log("1️⃣ Verifying test user setup...");
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", testEmail)
      .single();

    if (error || !user) {
      console.log("❌ Test user not found, creating...");
      // User setup code would go here, but we already created it
      return;
    }

    console.log("✅ Test user found:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.user_status}`);
    console.log(`   Email verified: ${user.email_verified}`);
    console.log(`   Active: ${user.is_active}`);

    // Test the authentication logic directly
    console.log("\n2️⃣ Testing authentication logic...");

    if (!user.email_verified) {
      console.log("❌ Email not verified");
      return;
    }

    if (user.user_status === "PENDING") {
      console.log("❌ User status is PENDING (should be VERIFIED)");
      return;
    } else if (user.user_status === "REJECTED") {
      console.log("❌ User status is REJECTED");
      return;
    } else if (user.user_status === "SUSPENDED") {
      console.log("❌ User status is SUSPENDED");
      return;
    } else if (!["VERIFIED", "APPROVED"].includes(user.user_status)) {
      console.log(
        `❌ User status is ${user.user_status} (not VERIFIED or APPROVED)`
      );
      return;
    }

    console.log("✅ User passes all authentication checks");

    // Test password verification
    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(
      testPassword,
      user.password_hash
    );
    console.log(
      `✅ Password verification: ${isValidPassword ? "PASS" : "FAIL"}`
    );

    if (!isValidPassword) {
      console.log("❌ Password verification failed");
      return;
    }

    console.log("\n3️⃣ Expected flow after successful login:");
    console.log("✅ NextAuth should create session with user data");
    console.log("✅ User object should include:");
    console.log("   - id, email, name, role, status");
    console.log("✅ JWT token should include:");
    console.log("   - role, status, loginTime");
    console.log("✅ Session should include:");
    console.log("   - user with id, email, name, role, status");

    console.log("\n4️⃣ Middleware behavior:");
    console.log(`✅ User status: ${user.user_status}`);
    if (user.user_status === "VERIFIED") {
      console.log("✅ Middleware should redirect to /pending-approval");
    } else if (user.user_status === "APPROVED") {
      console.log("✅ Middleware should allow access to dashboard");
    }

    console.log("\n🎯 Ready for manual testing:");
    console.log("1. Open http://localhost:3000/login");
    console.log(`2. Login with: ${testEmail} / ${testPassword}`);
    console.log(
      `3. Expected result: ${user.user_status === "VERIFIED" ? "Redirect to /pending-approval" : "Access to dashboard"}`
    );

    // Also test what happens when we approve the user
    console.log("\n5️⃣ Testing user approval flow...");
    console.log("To approve user and test dashboard access:");

    // Update user to APPROVED
    const { error: updateError } = await supabase
      .from("users")
      .update({ user_status: "APPROVED" })
      .eq("id", user.id);

    if (updateError) {
      console.log("❌ Failed to approve user:", updateError);
    } else {
      console.log(
        "✅ User approved! Now they should be able to access dashboard"
      );
      console.log("📝 Re-login to test dashboard access:");
      console.log("1. Logout if logged in");
      console.log("2. Login again with same credentials");
      console.log("3. Should now redirect to /dashboard");
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testFullLoginFlow();
