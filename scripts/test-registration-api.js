#!/usr/bin/env node

/**
 * Test Registration API with First/Last Name Fields
 * This script tests the registration endpoint with the new field structure
 */

const test_url = "http://localhost:3000/api/auth/register";

async function testRegistration() {
  console.log("Testing registration API with first/last name fields...\n");

  // Test data with separate first and last names
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: `test.user.${Date.now()}@example.com`, // Unique email
    password: "password123",
    role: "STAFF",
  };

  try {
    console.log("1. Testing registration with valid data:");
    console.log("   Data:", JSON.stringify(testUser, null, 2));

    const response = await fetch(test_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    });

    console.log("   Status:", response.status);
    console.log("   Headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("   Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("   ✅ Registration successful!");

      // Verify the response contains the expected fields
      if (data.user && data.user.firstName && data.user.lastName) {
        console.log("   ✅ Response contains firstName and lastName fields");
      } else {
        console.log("   ❌ Response missing firstName/lastName fields");
      }
    } else {
      console.log("   ❌ Registration failed");
    }
  } catch (error) {
    console.error("   ❌ Error during registration:", error.message);
  }

  console.log("\n---\n");

  // Test validation errors
  try {
    console.log("2. Testing validation errors (missing fields):");

    const invalidData = {
      firstName: "", // Empty first name
      lastName: "", // Empty last name
      email: "invalid-email", // Invalid email
      password: "123", // Too short password
    };

    console.log("   Data:", JSON.stringify(invalidData, null, 2));

    const response = await fetch(test_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidData),
    });

    console.log("   Status:", response.status);
    const data = await response.json();
    console.log("   Response:", JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log("   ✅ Validation errors handled correctly");
    } else {
      console.log("   ❌ Expected validation errors (400 status)");
    }
  } catch (error) {
    console.error("   ❌ Error during validation test:", error.message);
  }
}

// Run the test
testRegistration().catch(console.error);
