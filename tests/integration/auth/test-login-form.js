async function testLoginViaForm() {
  try {
    console.log("🧪 Testing login form submission...\n");

    const baseUrl = "http://localhost:3000";

    // First get CSRF token
    console.log("1️⃣ Getting CSRF token...");
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log("CSRF Token:", csrfData.csrfToken);

    // Test login
    console.log("\n2️⃣ Testing login submission...");

    const formData = new URLSearchParams({
      email: "baawapay+verified-test@gmail.com",
      password: "password123",
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${baseUrl}/dashboard`,
      json: "true",
    });

    const loginResponse = await fetch(
      `${baseUrl}/api/auth/callback/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: csrfResponse.headers.get("set-cookie") || "",
        },
        body: formData,
        redirect: "manual",
      }
    );

    console.log("Login response status:", loginResponse.status);
    console.log(
      "Login response location:",
      loginResponse.headers.get("location")
    );

    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get("location");
      if (location) {
        if (location.includes("/pending-approval")) {
          console.log("✅ SUCCESS: Redirected to pending approval page");
        } else if (location.includes("/dashboard")) {
          console.log(
            "✅ SUCCESS: Redirected to dashboard (user might be approved)"
          );
        } else if (location.includes("/login")) {
          console.log("❌ REDIRECTED BACK TO LOGIN: Authentication failed");
        } else {
          console.log(`⚠️  UNEXPECTED REDIRECT: ${location}`);
        }
      }
    }

    // Try to get session after login
    console.log("\n3️⃣ Checking session after login...");
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        Cookie: loginResponse.headers.get("set-cookie") || "",
      },
    });

    const sessionData = await sessionResponse.json();
    console.log("Session data:", JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testLoginViaForm();
