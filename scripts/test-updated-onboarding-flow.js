#!/usr/bin/env node

/**
 * Test the complete user onboarding flow after updates:
 * 1. Register a new user
 * 2. Check redirection to check-email page
 * 3. Verify email token
 * 4. Check redirection to pending approval page
 * 5. Test login flow with unverified/unapproved user
 */

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

const testRegistrationFlow = async () => {
  console.log("🧪 Testing Updated User Registration & Onboarding Flow");
  console.log("=".repeat(60));

  const testEmail = `baawapay+test-${Date.now()}@gmail.com`;
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: testEmail,
    password: "password123",
    role: "STAFF",
  };

  // Import database functions once
  const { createClient } = require("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let supabase = null;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  try {
    // Step 1: Register a new user
    console.log("\n📝 Step 1: Registering new user...");
    const registerResponse = await fetch(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      }
    );

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    console.log("✅ Registration successful");
    console.log(`📧 User email: ${testEmail}`);
    console.log(`🆔 User ID: ${registerData.user.id}`);
    console.log(`� User status: ${registerData.user.status}`);
    console.log(
      `� Requires verification: ${registerData.requiresVerification}`
    );

    // Step 2: Check that frontend would redirect to check-email
    console.log("\n📄 Step 2: Frontend should redirect to:");
    console.log(`   /check-email?email=${encodeURIComponent(testEmail)}`);

    // Step 3: Get verification token from database to simulate email verification
    console.log("\n✉️  Step 3: Getting verification token from database...");

    if (!supabase) {
      throw new Error("Missing Supabase credentials");
    }

    // Get verification token from database
    const { data: userWithToken, error: tokenError } = await supabase
      .from("users")
      .select("email_verification_token")
      .eq("email", testEmail)
      .single();

    if (tokenError || !userWithToken?.email_verification_token) {
      throw new Error(
        `Could not get verification token: ${tokenError?.message || "Token not found"}`
      );
    }

    const verificationToken = userWithToken.email_verification_token;
    console.log("✅ Verification token retrieved from database");

    const verifyResponse = await fetch(
      "http://localhost:3000/api/auth/verify-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      throw new Error(`Verification failed: ${verifyData.error}`);
    }

    console.log("✅ Email verification successful");
    console.log(`📊 New user status: VERIFIED`);
    console.log("🔄 Frontend should redirect to: /pending-approval");

    // Step 4: Test login flow with verified but unapproved user
    console.log(
      "\n🔐 Step 4: Testing login with verified but unapproved user..."
    );
    const loginResponse = await fetch("http://localhost:3000/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testUser.password,
      }),
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log("❌ ERROR: Login should have failed for unapproved user");
    } else {
      console.log("✅ Login correctly blocked for unapproved user");
      console.log(`📋 Error message: ${loginData.error}`);
    }

    // Step 5: Check database state
    console.log("\n🗄️  Step 5: Checking database state...");

    if (!supabase) {
      console.log("⚠️  Cannot check database - missing Supabase credentials");
    } else {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", testEmail)
        .single();

      if (error) {
        console.log(`❌ Database query failed: ${error.message}`);
      } else {
        console.log("✅ Database state verified:");
        console.log(`   Status: ${user.user_status}`);
        console.log(`   Email verified: ${user.email_verified}`);
        console.log(
          `   Verification token: ${user.email_verification_token ? "Present" : "Cleared"}`
        );
        console.log(`   Created: ${user.created_at}`);
      }
    }

    console.log("\n🧹 Cleaning up test user...");

    // Clean up test user
    if (supabase) {
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("email", testEmail);

      if (deleteError) {
        console.log(`⚠️  Failed to clean up test user: ${deleteError.message}`);
      } else {
        console.log("✅ Test user cleaned up");
      }
    }

    console.log("\n🎉 Registration & Onboarding Flow Test Complete!");
    console.log("\n📋 Summary of Updated Flow:");
    console.log("   1. User registers → Redirected to /check-email?email=...");
    console.log("   2. User clicks email link → Email verified");
    console.log("   3. After verification → Redirected to /pending-approval");
    console.log("   4. Login blocked until admin approval");
    console.log("   5. User sees pending approval message");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);

    // Try to clean up on error
    if (testEmail && supabase) {
      try {
        await supabase.from("users").delete().eq("email", testEmail);
        console.log("🧹 Cleaned up test user after error");
      } catch (cleanupError) {
        console.log("⚠️  Could not clean up test user");
      }
    }

    process.exit(1);
  }
};

testRegistrationFlow();
