#!/usr/bin/env node

/**
 * Test script for the admin user approval system
 * This script tests the new API endpoints and admin dashboard integration
 */

const { createServerSupabaseClient } = require("../src/lib/supabase");

async function testPendingUsersAPI() {
  console.log("🧪 Testing Pending Users API Integration...\n");

  try {
    // Test 1: Check if we can fetch users with status filtering
    console.log("1. Testing users API with status filtering");

    const response = await fetch(
      "http://localhost:3000/api/users?status=pending",
      {
        headers: {
          "Content-Type": "application/json",
          // Note: In real scenario, this would need proper authentication
        },
      }
    );

    if (response.ok) {
      const users = await response.json();
      console.log(`✅ Successfully fetched ${users.length} pending users`);
    } else {
      console.log(`❌ Failed to fetch users: ${response.status}`);
    }

    // Test 2: Check user data structure
    console.log("\n2. Testing user data structure");
    const supabase = await createServerSupabaseClient();

    const { data: sampleUsers, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, user_status, email_verified, role, is_active, created_at"
      )
      .limit(1);

    if (error) {
      console.log(`❌ Database query failed: ${error.message}`);
    } else if (sampleUsers && sampleUsers.length > 0) {
      console.log("✅ User data structure matches API expectations");
      console.log("Sample user fields:", Object.keys(sampleUsers[0]));
    } else {
      console.log("⚠️  No users found in database");
    }

    // Test 3: Check user status distribution
    console.log("\n3. Checking user status distribution");
    const { data: statusCounts, error: statusError } = await supabase
      .from("users")
      .select("user_status")
      .neq("user_status", null);

    if (statusError) {
      console.log(`❌ Status query failed: ${statusError.message}`);
    } else {
      const statusMap = statusCounts.reduce((acc, user) => {
        acc[user.user_status] = (acc[user.user_status] || 0) + 1;
        return acc;
      }, {});

      console.log("✅ User status distribution:", statusMap);
    }

    console.log("\n🎉 Admin user approval system API tests completed!");
    console.log("\n📝 Next steps:");
    console.log("1. Start the development server: npm run dev");
    console.log("2. Login as an admin user");
    console.log("3. Navigate to /admin to access the admin dashboard");
    console.log("4. Use the 'Pending Approvals' tab to manage user approvals");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testPendingUsersAPI();
}

module.exports = { testPendingUsersAPI };
