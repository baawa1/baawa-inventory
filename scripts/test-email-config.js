#!/usr/bin/env node

/**
 * Test email service after API key update
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function testEmailService() {
  try {
    console.log("🧪 Testing Email Service Configuration...\n");

    // Check environment variables
    console.log("📋 Environment Check:");
    console.log(
      `  - RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing"}`
    );
    console.log(
      `  - RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || "❌ Missing"}`
    );
    console.log(
      `  - RESEND_FROM_NAME: ${process.env.RESEND_FROM_NAME || "❌ Missing"}`
    );
    console.log("");

    // Test API call to localhost to trigger email
    console.log("🔗 Testing Email API Endpoints...");

    const testEmail = "baawapay+test-notification@gmail.com";

    console.log("💡 To test the email notifications:");
    console.log("1. Open admin dashboard: http://localhost:3000/admin");
    console.log('2. Go to "Pending Approvals" tab');
    console.log("3. Try approving/rejecting a user");
    console.log('4. Go to "Active Users" tab');
    console.log("5. Try editing a user's role");
    console.log("6. Check email delivery in your email provider dashboard");
    console.log("");

    console.log("🔍 Check server logs for any email errors:");
    console.log("  - Failed to send approval email");
    console.log("  - Failed to send role change email");
    console.log("  - Failed to send admin notification");
    console.log("");

    console.log("📊 Expected email notifications:");
    console.log("  - User creation: No email (admin-created users)");
    console.log("  - User approval: Approval email + Welcome email");
    console.log("  - User rejection: Rejection email");
    console.log("  - Role change: Role change notification email");
    console.log("  - User deactivation: No email currently");
    console.log("");

    console.log("✅ Ready to test! Make sure the dev server is running.");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testEmailService();
