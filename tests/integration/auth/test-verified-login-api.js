async function testVerifiedUserLoginFlow() {
  try {
    console.log("🧪 Testing VERIFIED user login flow via API...\n");

    const baseUrl = "http://localhost:3000";

    // Test login with verified user (should succeed but redirect to pending approval)
    console.log("1️⃣ Testing login with VERIFIED user...");

    const loginResponse = await fetch(
      `${baseUrl}/api/auth/callback/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "baawapay+test5@gmail.com",
          password: "password123",
          csrfToken: "test", // In real scenario, this would be properly fetched
          callbackUrl: `${baseUrl}/dashboard`,
          json: true,
        }),
      }
    );

    console.log("Login response status:", loginResponse.status);
    console.log(
      "Login response headers:",
      Object.fromEntries(loginResponse.headers)
    );

    if (loginResponse.status === 200) {
      console.log("✅ Login request successful");

      // Check if we get proper session
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          Cookie: loginResponse.headers.get("set-cookie") || "",
        },
      });

      const sessionData = await sessionResponse.json();
      console.log("Session data:", sessionData);

      if (sessionData.user && sessionData.user.status === "VERIFIED") {
        console.log("✅ User status correctly returned as VERIFIED");
        console.log("✅ Middleware should redirect to /pending-approval");
      } else {
        console.log("❌ Session data incorrect:", sessionData);
      }
    } else {
      const errorData = await loginResponse.text();
      console.log("❌ Login failed:", errorData);
    }

    console.log("\n2️⃣ Testing NextAuth signIn API...");

    // Alternative test using NextAuth's built-in endpoint
    const signInResponse = await fetch(
      `${baseUrl}/api/auth/signin/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "baawapay+test5@gmail.com",
          password: "password123",
          redirect: "false",
        }),
      }
    );

    console.log("SignIn response status:", signInResponse.status);
    const signInData = await signInResponse.text();
    console.log("SignIn response:", signInData);
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

// Give the server a moment to start
setTimeout(testVerifiedUserLoginFlow, 2000);
