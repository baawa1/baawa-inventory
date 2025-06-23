const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://bhwywfigcyotkxbujivm.supabase.co",
  "***REMOVED***"
);

async function testVerifiedUserLogin() {
  try {
    console.log("🔍 Testing VERIFIED user login flow...\n");

    // First, let's see the current user statuses
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, user_status, email_verified, first_name, last_name")
      .limit(5);

    if (error) throw error;

    console.log("📋 Current users:");
    users.forEach((user) => {
      console.log(
        `  ${user.email}: ${user.user_status} (verified: ${user.email_verified})`
      );
    });

    // Find a user we can test with
    const testUser = users.find((u) => u.email.includes("baawapay+test"));
    if (testUser) {
      console.log(`\n🎯 Found test user: ${testUser.email}`);
      console.log(
        `Current status: ${testUser.user_status}, Email verified: ${testUser.email_verified}`
      );

      // Make sure they are VERIFIED status for this test
      const { error: updateError } = await supabase
        .from("users")
        .update({
          user_status: "VERIFIED",
          email_verified: true,
        })
        .eq("id", testUser.id);

      if (updateError) throw updateError;

      console.log("✅ Updated test user to VERIFIED status");
      console.log("\n📝 Expected behavior:");
      console.log("  1. User can login successfully");
      console.log("  2. Auth returns user with status: VERIFIED");
      console.log("  3. Middleware redirects to /pending-approval");
      console.log(
        "  4. User sees pending approval page until admin approves them"
      );

      // Get the updated user data
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", testUser.id)
        .single();

      console.log(`\n✅ Test user ready: ${updatedUser.email}`);
      console.log(`   Status: ${updatedUser.user_status}`);
      console.log(`   Email verified: ${updatedUser.email_verified}`);
      console.log(`   Password hash exists: ${!!updatedUser.password_hash}`);
    } else {
      console.log("\n❌ No test user found with baawapay+test email");
      console.log("Creating a test user...");

      // Create a test user for this flow
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password123", 10);

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email: "baawapay+verified-test@gmail.com",
          password_hash: hashedPassword,
          first_name: "Verified",
          last_name: "User",
          role: "USER",
          user_status: "VERIFIED",
          email_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log(`✅ Created test user: ${newUser.email}`);
      console.log(`   Status: ${newUser.user_status}`);
      console.log(`   Email verified: ${newUser.email_verified}`);
      console.log(`   Password: password123`);
    }

    console.log("\n🧪 Test this flow manually:");
    console.log("1. Go to http://localhost:3000/login");
    console.log("2. Login with the test user credentials");
    console.log("3. Should be redirected to /pending-approval");
    console.log("4. Change user status to APPROVED in DB to access dashboard");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testVerifiedUserLogin();
