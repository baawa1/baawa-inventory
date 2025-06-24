/**
 * Simple test for registration API with admin notifications
 * Run this script to test the complete registration flow including admin notifications
 */

async function testRegistrationWithAdminNotification() {
  console.log("🧪 Testing registration API with admin notifications\n");

  const testUserData = {
    firstName: "Test",
    lastName: "User",
    email: `test.user.${Date.now()}@example.com`,
    password: "testpassword123",
    role: "EMPLOYEE",
  };

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUserData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Registration successful!");
      console.log("📧 User data:", result.user);
      console.log("🔔 Admin notifications should have been sent");
      console.log("\nResponse:", result);
    } else {
      console.log("❌ Registration failed:");
      console.log(result);
    }
  } catch (error) {
    console.error("❌ Error testing registration:", error);
  }
}

// Only run if this script is executed directly (not in test environment)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  testRegistrationWithAdminNotification();
}

module.exports = { testRegistrationWithAdminNotification };
