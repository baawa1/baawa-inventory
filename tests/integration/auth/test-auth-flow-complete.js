#!/usr/bin/env node

/**
 * Test Complete Authentication Flow
 * This script tests registration and login with the new field structure
 */

const BASE_URL = "http://localhost:3000";

async function testAuthFlow() {
  console.log("Testing complete authentication flow...\n");

  // Generate unique test user
  const timestamp = Date.now();
  const testUser = {
    firstName: "Auth",
    lastName: "Test",
    email: `auth.test.${timestamp}@example.com`,
    password: "password123",
    role: "STAFF",
  };

  try {
    // Step 1: Register new user
    console.log("1. Registering new user...");
    console.log(
      "   Data:",
      JSON.stringify(
        {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email,
          role: testUser.role,
        },
        null,
        2
      )
    );

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();
    console.log("   Status:", registerResponse.status);
    console.log("   Response:", JSON.stringify(registerData, null, 2));

    if (!registerResponse.ok) {
      console.log("   ❌ Registration failed");
      return;
    }

    console.log("   ✅ Registration successful!");
    console.log("\n---\n");

    // Step 2: Test login with NextAuth
    console.log("2. Testing login via NextAuth...");

    // First, get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log("   CSRF Token obtained:", csrfData.csrfToken ? "✅" : "❌");

    // Test credentials login
    const loginData = new URLSearchParams({
      email: testUser.email,
      password: testUser.password,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/dashboard`,
    });

    const loginResponse = await fetch(
      `${BASE_URL}/api/auth/callback/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: loginData.toString(),
        redirect: "manual", // Don't follow redirects
      }
    );

    console.log("   Login Status:", loginResponse.status);
    console.log("   Location Header:", loginResponse.headers.get("location"));

    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get("location");
      if (location && location.includes("/dashboard")) {
        console.log("   ✅ Login successful - redirected to dashboard");
      } else if (location && location.includes("error")) {
        console.log("   ❌ Login failed - error redirect");
      } else {
        console.log("   ⚠️  Login response unclear - location:", location);
      }
    } else {
      console.log("   ❌ Unexpected login response status");
    }
  } catch (error) {
    console.error("   ❌ Error during auth flow test:", error.message);
  }

  console.log("\n---\n");

  // Step 3: Test validation that user exists in database
  console.log("3. Verifying user in database...");
  try {
    // We can't directly query the database from here, but we can check if the registration API
    // can detect duplicate email (which means the user exists)
    const duplicateResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser), // Same user data
    });

    const duplicateData = await duplicateResponse.json();
    console.log("   Duplicate registration status:", duplicateResponse.status);
    console.log("   Response:", JSON.stringify(duplicateData, null, 2));

    if (
      duplicateResponse.status === 400 &&
      duplicateData.error &&
      duplicateData.error.includes("Email already exists")
    ) {
      console.log("   ✅ User exists in database (email uniqueness enforced)");
    } else {
      console.log("   ⚠️  Unexpected duplicate registration response");
    }
  } catch (error) {
    console.error("   ❌ Error during database verification:", error.message);
  }
}

// Run the test
testAuthFlow().catch(console.error);
