console.log("🧪 Testing Login Flow After Logout Fix...\n");

async function testLoginFlow() {
  try {
    const baseUrl = "http://localhost:3000";

    console.log("1️⃣ Testing session status...");
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    const sessionData = await sessionResponse.json();

    console.log("Current session:", sessionData);

    if (sessionData.user) {
      console.log(`✅ User is logged in: ${sessionData.user.email}`);
      console.log(`   Status: ${sessionData.user.status}`);
      console.log(`   Role: ${sessionData.user.role}`);
    } else {
      console.log("❌ No active session found");
    }

    console.log("\n2️⃣ Testing login page access...");
    const loginPageResponse = await fetch(`${baseUrl}/login`);
    console.log("Login page status:", loginPageResponse.status);

    if (loginPageResponse.ok) {
      console.log("✅ Login page accessible");
    } else {
      console.log("❌ Login page not accessible");
    }

    console.log("\n3️⃣ Testing dashboard access...");
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      redirect: "manual",
    });

    console.log("Dashboard response status:", dashboardResponse.status);

    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get("location");
      console.log("Dashboard redirects to:", location);

      if (location?.includes("/login")) {
        console.log("✅ Correctly redirects unauthenticated users to login");
      } else if (location?.includes("/pending-approval")) {
        console.log(
          "✅ Correctly redirects VERIFIED users to pending approval"
        );
      } else {
        console.log("⚠️  Unexpected redirect");
      }
    } else if (dashboardResponse.status === 200) {
      console.log("✅ Dashboard accessible (user is logged in and approved)");
    }

    console.log("\n📋 Manual Test Steps:");
    console.log("1. Clear browser cache/cookies if needed");
    console.log("2. Go to: http://localhost:3000/login");
    console.log(
      "3. Login with: baawapay+verified-test@gmail.com / password123"
    );
    console.log("4. Should now redirect to dashboard (user is APPROVED)");
    console.log("");
    console.log(
      "If you see any errors, please share the specific error message!"
    );
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testLoginFlow();
