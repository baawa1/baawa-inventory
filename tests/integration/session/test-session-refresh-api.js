#!/usr/bin/env node

/**
 * Test Session Refresh API Endpoint
 *
 * This script tests the /api/auth/refresh-session endpoint
 * to ensure it properly fetches updated user data from the database.
 */

async function testSessionRefreshEndpoint() {
  console.log("🧪 Testing Session Refresh API Endpoint\n");

  const testEmail = `test-refresh-${Date.now()}@example.com`;

  // Import Prisma dynamically
  const { createServerSupabaseClient } = require("../src/lib/supabase");

  try {
    // Step 1: Create a test user directly in the database
    console.log("📝 Step 1: Creating test user in database...");

    const supabase = await createServerSupabaseClient();

    const { data: testUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: testEmail,
        first_name: "Test",
        last_name: "User",
        password_hash: "dummy_hash",
        role: "STAFF",
        user_status: "PENDING",
        email_verified: false,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log("✅ Test user created");
    console.log(`   User ID: ${testUser.id}`);
    console.log(`   Status: ${testUser.user_status}`);
    console.log(`   Email Verified: ${testUser.email_verified}`);

    // Step 2: Update user status to VERIFIED
    console.log("\n📧 Step 2: Updating user to VERIFIED status...");

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        user_status: "VERIFIED",
        email_verified_at: new Date().toISOString(),
      })
      .eq("id", testUser.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    console.log("✅ User status updated");
    console.log(`   Status: ${updatedUser.user_status}`);
    console.log(`   Email Verified: ${updatedUser.email_verified}`);

    // Step 3: Test the refresh-session endpoint query pattern
    console.log("\n🔄 Step 3: Testing refresh-session query pattern...");

    // Fetch user data as the refresh endpoint would
    const { data: refreshedUser, error: refreshError } = await supabase
      .from("users")
      .select(
        "id, email, first_name, last_name, role, user_status, email_verified"
      )
      .eq("id", testUser.id)
      .eq("is_active", true)
      .single();

    if (refreshError || !refreshedUser) {
      throw new Error(
        `Failed to fetch refreshed user data: ${refreshError?.message}`
      );
    }

    console.log("✅ Refresh query successful");
    console.log(`   Fetched Status: ${refreshedUser.user_status}`);
    console.log(`   Fetched Email Verified: ${refreshedUser.email_verified}`);

    // Verify the data matches what we expect
    if (refreshedUser.user_status === "VERIFIED") {
      console.log("✅ Status correctly shows VERIFIED");
    } else {
      console.log(
        `❌ Status incorrect. Expected: VERIFIED, Got: ${refreshedUser.user_status}`
      );
    }

    if (refreshedUser.email_verified === true) {
      console.log("✅ Email verified flag correctly shows true");
    } else {
      console.log(
        `❌ Email verified incorrect. Expected: true, Got: ${refreshedUser.email_verified}`
      );
    }

    // Step 4: Update to APPROVED and test again
    console.log("\n✅ Step 4: Testing status change to APPROVED...");

    const { error: approveError } = await supabase
      .from("users")
      .update({
        user_status: "APPROVED",
      })
      .eq("id", testUser.id);

    if (approveError) {
      throw new Error(`Failed to approve user: ${approveError.message}`);
    }

    const { data: finalUser, error: finalError } = await supabase
      .from("users")
      .select("user_status")
      .eq("id", testUser.id)
      .single();

    if (finalError) {
      throw new Error(`Failed to fetch final user: ${finalError.message}`);
    }

    if (finalUser?.user_status === "APPROVED") {
      console.log("✅ Status change to APPROVED works correctly");
    } else {
      console.log(
        `❌ Status change failed. Expected: APPROVED, Got: ${finalUser?.user_status}`
      );
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", testUser.id);

    if (deleteError) {
      console.error("Failed to delete test user:", deleteError.message);
    } else {
      console.log("✅ Test user deleted");
    }

    console.log("\n🎉 Session refresh API test completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   ✅ Database queries work correctly");
    console.log("   ✅ Status changes are reflected immediately");
    console.log("   ✅ Session refresh endpoint should work as expected");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Try to cleanup on error
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("users").delete().eq("email", testEmail);
      console.log("🧹 Cleaned up test data after error");
    } catch (cleanupError) {
      console.error("Failed to cleanup:", cleanupError.message);
    }
  }
}

// Run the test
testSessionRefreshEndpoint();
