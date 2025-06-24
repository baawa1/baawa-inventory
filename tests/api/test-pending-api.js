#!/usr/bin/env node

/**
 * Test the pending users API endpoint
 */

const fetch = require("node-fetch");

async function testPendingUsersAPI() {
  try {
    console.log("🧪 Testing /api/users API endpoint...\n");

    // Test fetching all users (should show pending users)
    const response = await fetch("http://localhost:3000/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response:", errorText);
      return;
    }

    const users = await response.json();
    console.log(`📊 API returned ${users.length} users`);

    // Filter pending users
    const pendingUsers = users.filter((user) => user.userStatus === "PENDING");
    console.log(`🔔 Found ${pendingUsers.length} pending users`);

    pendingUsers.slice(0, 3).forEach((user) => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(
        `    Status: ${user.userStatus}, Email Verified: ${user.emailVerified}`
      );
    });

    if (pendingUsers.length > 3) {
      console.log(`  ... and ${pendingUsers.length - 3} more`);
    }
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testPendingUsersAPI();
