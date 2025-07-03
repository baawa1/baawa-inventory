#!/usr/bin/env node

/**
 * Test the login flow for a VERIFIED user to debug the session issue
 */

async function testVerifiedUserLogin() {
  console.log("🧪 Testing VERIFIED user login flow...\n");

  const testEmail = "baawapay+test12@gmail.com";
  const testPassword = "password123"; // Assuming this is the test password

  try {
    // Step 1: Test login API
    console.log("1️⃣ Testing login API...");
    const loginResponse = await fetch(
      "http://localhost:3000/api/auth/signin/credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: testEmail,
          password: testPassword,
          redirect: "false",
        }),
      }
    );

    console.log(`Login response status: ${loginResponse.status}`);

    if (loginResponse.ok) {
      console.log("✅ Login should succeed");
      console.log("Expected: User redirected to /pending-approval");
    } else {
      console.log("❌ Login failed");
      const errorText = await loginResponse.text();
      console.log("Error:", errorText);
    }

    console.log("\n2️⃣ Manual testing steps:");
    console.log("To debug the session issue manually:");
    console.log(`1. Go to: http://localhost:3000/login`);
    console.log(`2. Login with: ${testEmail} / ${testPassword}`);
    console.log("3. Open browser dev tools console");
    console.log("4. Look for console logs about session refresh");
    console.log("5. Check what session.user.status contains");
    console.log("");

    console.log("🔍 In browser console, run this to check session:");
    console.log("```javascript");
    console.log("// Check current session data");
    console.log("const { useSession } = require('next-auth/react');");
    console.log("const { data: session } = useSession();");
    console.log("console.log('Session data:', session);");
    console.log("console.log('User status:', session?.user?.status);");
    console.log(
      "console.log('Email verified:', session?.user?.emailVerified);"
    );
    console.log("```");
    console.log("");

    console.log("🔧 Debugging checklist:");
    console.log("✅ Database shows status: VERIFIED");
    console.log("✅ Auth service returns status: VERIFIED");
    console.log("❓ JWT token contains status: ?");
    console.log("❓ Session contains status: ?");
    console.log("❓ Pending approval page receives status: ?");
    console.log("");

    console.log("💡 If status is undefined/null in session:");
    console.log("- Check auth-config.ts JWT callback");
    console.log("- Check auth-service.ts refreshUserData method");
    console.log("- Check for any errors in server logs");
    console.log("");

    console.log("💡 If session contains wrong status:");
    console.log("- Try clearing browser localStorage/sessionStorage");
    console.log("- Try logging out and logging back in");
    console.log(
      "- Check if session.update() is working in pending-approval page"
    );
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testVerifiedUserLogin();
