const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const supabase = createClient(
  "https://bhwywfigcyotkxbujivm.supabase.co",
  "***REMOVED***"
);

async function testLoginFlowComplete() {
  try {
    console.log("🧪 Complete Login Flow Test for VERIFIED Users\n");

    // Test user credentials
    const testEmail = "baawapay+verified-test@gmail.com";
    const testPassword = "password123";

    console.log("1️⃣ Setting up test user...");

    // Create/update test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // First, check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", testEmail)
      .single();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: hashedPassword,
          user_status: "VERIFIED",
          email_verified: true,
          is_active: true,
        })
        .eq("id", existingUser.id);

      if (updateError) throw updateError;
      console.log("✅ Updated existing test user");
    } else {
      // Create new user
      const { error: createError } = await supabase.from("users").insert({
        email: testEmail,
        password_hash: hashedPassword,
        first_name: "Verified",
        last_name: "TestUser",
        role: "STAFF",
        user_status: "VERIFIED",
        email_verified: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createError) throw createError;
      console.log("✅ Created new test user");
    }

    // Verify the user data
    const { data: testUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", testEmail)
      .single();

    console.log("📋 Test user details:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Status: ${testUser.user_status}`);
    console.log(`   Email verified: ${testUser.email_verified}`);
    console.log(`   Active: ${testUser.is_active}`);
    console.log(
      `   Password hash: ${testUser.password_hash ? "Present" : "Missing"}`
    );

    // Test password verification
    console.log("\n2️⃣ Testing password verification...");
    const isPasswordValid = await bcrypt.compare(
      testPassword,
      testUser.password_hash
    );
    console.log(
      `✅ Password verification: ${isPasswordValid ? "PASS" : "FAIL"}`
    );

    if (!isPasswordValid) {
      throw new Error("Password verification failed");
    }

    console.log("\n3️⃣ Expected login behavior:");
    console.log("✅ User should be able to login with these credentials");
    console.log("✅ Auth should return user with status VERIFIED");
    console.log("✅ Middleware should redirect to /pending-approval");
    console.log("✅ User should see pending approval page");

    console.log("\n🧪 Manual Test Instructions:");
    console.log("1. Go to: http://localhost:3000/login");
    console.log(`2. Login with: ${testEmail} / ${testPassword}`);
    console.log("3. Should redirect to: /pending-approval");
    console.log("4. Should see: Pending approval message");

    console.log("\n🔧 To approve user for dashboard access:");
    console.log(
      "Run: UPDATE users SET user_status = 'APPROVED' WHERE email = '${testEmail}';"
    );

    return {
      email: testEmail,
      password: testPassword,
      userStatus: testUser.user_status,
      emailVerified: testUser.email_verified,
    };
  } catch (error) {
    console.error("❌ Test setup error:", error);
    throw error;
  }
}

testLoginFlowComplete();
