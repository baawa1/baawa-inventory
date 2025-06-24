/**
 * API Test for User Management
 * This file tests the user management API endpoints
 */

const BASE_URL = "http://localhost:3000";

async function testUserAPI() {
  console.log("Testing User Management API...\n");

  try {
    // Test 1: Create an admin user
    console.log("1. Creating an admin user...");
    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Admin",
        lastName: "Test",
        email: "admin@test.com",
        password: "admin123",
        role: "ADMIN",
      }),
    });

    if (createResponse.ok) {
      const user = await createResponse.json();
      console.log("✅ Admin user created:", user);
    } else {
      const error = await createResponse.text();
      console.log("❌ Failed to create admin user:", error);
    }

    // Test 2: List users
    console.log("\n2. Fetching users list...");
    const listResponse = await fetch(`${BASE_URL}/api/users`);

    if (listResponse.ok) {
      const users = await listResponse.json();
      console.log("✅ Users fetched successfully:", users);
    } else {
      const error = await listResponse.text();
      console.log("❌ Failed to fetch users:", error);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run the test if the server is available
testUserAPI().catch(console.error);
