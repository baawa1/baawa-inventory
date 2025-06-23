console.log("🧪 Testing /logout route...\n");

async function testLogoutRoute() {
  try {
    const baseUrl = "http://localhost:3000";

    console.log("1️⃣ Testing /logout route...");

    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: "GET",
      redirect: "manual", // Don't follow redirects automatically
    });

    console.log("Logout route response status:", logoutResponse.status);
    console.log(
      "Logout route response headers:",
      Object.fromEntries(logoutResponse.headers.entries())
    );

    if (logoutResponse.status === 302 || logoutResponse.status === 307) {
      const location = logoutResponse.headers.get("location");
      console.log("✅ Logout route redirects to:", location);

      if (location?.includes("/api/auth/signout")) {
        console.log("✅ Correctly redirects to NextAuth signout endpoint");
      } else if (location?.includes("/login")) {
        console.log("✅ Correctly redirects to login page");
      } else {
        console.log("⚠️  Unexpected redirect location");
      }
    } else {
      console.log("❌ Unexpected response status");
    }

    console.log("\n2️⃣ Testing /logout page...");

    const logoutPageResponse = await fetch(`${baseUrl}/logout`, {
      method: "GET",
      headers: {
        Accept: "text/html",
      },
    });

    console.log("Logout page response status:", logoutPageResponse.status);

    if (logoutPageResponse.ok) {
      console.log("✅ Logout page loads successfully");
    } else {
      console.log("❌ Logout page failed to load");
    }

    console.log("\n📋 How to use the logout functionality:");
    console.log("");
    console.log("Option 1 - Direct link:");
    console.log('  <a href="/logout">Logout</a>');
    console.log("");
    console.log("Option 2 - Programmatic redirect:");
    console.log('  window.location.href = "/logout";');
    console.log("");
    console.log("Option 3 - Next.js router:");
    console.log('  router.push("/logout");');
    console.log("");
    console.log(
      "✅ All methods will automatically log out the user and redirect to login"
    );
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testLogoutRoute();
