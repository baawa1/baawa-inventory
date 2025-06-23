#!/usr/bin/env node

const BASE_URL = "http://localhost:3000";

async function testAuthFlow() {
  console.log("🧪 Testing Authentication Flow...\n");

  // Test 1: Register a new user
  console.log("1. Testing Registration...");
  try {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "password123",
        role: "MANAGER",
      }),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log("✅ Registration successful:", registerData.message);
      console.log("   User ID:", registerData.user.id);
      console.log(
        "   Name:",
        registerData.user.firstName,
        registerData.user.lastName
      );
      console.log("   Role:", registerData.user.role);
    } else {
      const error = await registerResponse.text();
      console.log("❌ Registration failed:", error);
    }
  } catch (error) {
    console.log("❌ Registration error:", error.message);
  }

  console.log("\n2. Testing NextAuth.js session...");
  try {
    // Test NextAuth session endpoint
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log("✅ Session endpoint accessible");
      console.log("   Current session:", sessionData || "No active session");
    } else {
      console.log("❌ Session endpoint failed");
    }
  } catch (error) {
    console.log("❌ Session error:", error.message);
  }

  console.log("\n✨ Authentication flow test completed!");
}

testAuthFlow().catch(console.error);
