#!/usr/bin/env node

/**
 * Test the user approval/rejection email functionality
 */

const { emailService } = require("../src/lib/email");

async function testApprovalEmails() {
  try {
    console.log("🧪 Testing user approval/rejection email functionality...\n");

    const testEmail = "baawapay+test-approval@gmail.com";

    // Test approval email
    console.log("📧 Testing approval email...");
    await emailService.sendUserApprovalEmail(testEmail, {
      firstName: "Test User",
      adminName: "Admin User",
      dashboardLink: "http://localhost:3000/dashboard",
      role: "STAFF",
    });
    console.log("✅ Approval email sent successfully");

    // Test rejection email
    console.log("📧 Testing rejection email...");
    await emailService.sendUserRejectionEmail(testEmail, {
      firstName: "Test User",
      adminName: "Admin User",
      rejectionReason: "Incomplete application information provided.",
      supportEmail: "support@baawa.com",
    });
    console.log("✅ Rejection email sent successfully");

    console.log("\n🎉 All email tests completed successfully!");
    console.log(`📬 Check ${testEmail} for the test emails`);
  } catch (error) {
    console.error("❌ Error testing emails:", error);
    console.error("\nTroubleshooting:");
    console.error("1. Check RESEND_API_KEY or SMTP credentials in .env.local");
    console.error("2. Verify email service configuration");
    console.error("3. Check network connectivity");
  }
}

// Run the test
testApprovalEmails();
