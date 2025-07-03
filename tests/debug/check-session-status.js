#!/usr/bin/env node

/**
 * Debug script to check what happens when a VERIFIED user logs in
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVerifiedUserStatus() {
  try {
    console.log("🔍 Checking VERIFIED users...\n");

    // Get VERIFIED users
    const { data: verifiedUsers, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_status", "VERIFIED")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching verified users:", error);
      return;
    }

    console.log(`Found ${verifiedUsers.length} VERIFIED users:\n`);

    verifiedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.user_status}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      if (user.email_verified_at) {
        console.log(
          `   Email Verified At: ${new Date(user.email_verified_at).toLocaleString()}`
        );
      }
      console.log("");
    });

    // Test the authentication service behavior
    if (verifiedUsers.length > 0) {
      const testUser = verifiedUsers[0];
      console.log(`🧪 Testing auth service behavior for: ${testUser.email}`);

      // Simulate what the auth service returns
      console.log("Auth service would return:");
      console.log(`   ID: ${testUser.id}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Name: ${testUser.first_name} ${testUser.last_name}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Status: ${testUser.user_status}`);
      console.log(`   Email Verified: ${testUser.email_verified}`);
      console.log("");

      console.log("📊 Expected behavior:");
      console.log("   ✅ Login should succeed (VERIFIED status allows login)");
      console.log("   ✅ Should be redirected to /pending-approval");
      console.log("   ✅ Should see 'Account Pending Approval' message");
      console.log("   ✅ Should show green checkmark for email verification");
      console.log("   ❌ Should NOT see 'Account Status Unknown'");
      console.log("");

      console.log("🔧 If seeing 'Account Status Unknown', check:");
      console.log("   1. Session refresh is working properly");
      console.log("   2. JWT token contains correct status");
      console.log("   3. No middleware redirects interfering");
      console.log("   4. Console logs in browser for session updates");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkVerifiedUserStatus();
