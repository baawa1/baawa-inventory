/**
 * Resend Email Testing Script
 * Tests the new Resend integration with baawapay email variations
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function testResendSetup() {
  console.log("🚀 Testing Resend Email Setup\n");

  try {
    // Check environment variables
    console.log("🔍 Checking Resend configuration...");
    const requiredVars = {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
    };

    let allSet = true;
    for (const [key, value] of Object.entries(requiredVars)) {
      const status = value ? "✅" : "❌";
      const displayValue = value
        ? key === "RESEND_API_KEY"
          ? "[SET]"
          : value
        : "NOT SET";
      console.log(`  ${status} ${key}: ${displayValue}`);
      if (!value) allSet = false;
    }

    if (!allSet) {
      console.log("\n❌ Missing required environment variables");
      return;
    }

    // Test Resend connection
    console.log("\n📧 Testing Resend API connection...");
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate test email using baawapay variation
    const timestamp = Date.now().toString().slice(-6);
    const testEmail = `baawapay+resend-test-${timestamp}@gmail.com`;

    console.log(`   Sending test email to: ${testEmail}`);

    const result = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: testEmail,
      subject: "Resend Test Email - Baawa Inventory POS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🎉 Resend Test Successful!</h2>
          <p>Hello from your Baawa Inventory POS system!</p>
          <p>This email confirms that Resend is working correctly with your application.</p>
          
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #0369a1;">✅ Configuration Status</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li><strong>Provider:</strong> Resend</li>
              <li><strong>From Email:</strong> ${process.env.RESEND_FROM_EMAIL}</li>
              <li><strong>From Name:</strong> ${process.env.RESEND_FROM_NAME}</li>
              <li><strong>Test Email:</strong> ${testEmail}</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #059669;">🚀 Ready for Production</h3>
            <p style="margin: 0;">Your email system is now ready for:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Email verification after user registration</li>
              <li>Password reset emails</li>
              <li>User approval notifications</li>
              <li>Admin notifications</li>
              <li>Welcome emails</li>
            </ul>
          </div>
          
          <p>If you received this email, your Resend integration is working perfectly!</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This email was sent from the Baawa Inventory POS email system test.
          </p>
        </div>
      `,
      text: `Resend Test Email - Baawa Inventory POS

Hello! This email confirms that Resend is working correctly.

Configuration:
- Provider: Resend
- From Email: ${process.env.RESEND_FROM_EMAIL}  
- From Name: ${process.env.RESEND_FROM_NAME}
- Test Email: ${testEmail}
- Test Date: ${new Date().toLocaleString()}

Your email system is ready for production!`,
    });

    if (result.error) {
      console.log("❌ Resend API Error:", result.error);
      return;
    }

    console.log("✅ Test email sent successfully!");
    console.log(`   Email ID: ${result.data?.id || "N/A"}`);

    console.log("\n🎉 Resend integration is working perfectly!");
    console.log("\n📋 Summary:");
    console.log("  ✅ Resend package installed");
    console.log("  ✅ API key configured");
    console.log("  ✅ Email service updated");
    console.log("  ✅ Test email sent successfully");
    console.log("  ✅ baawapay email variations working");

    console.log("\n📧 Check your email at: https://gmail.com");
    console.log(`   Look for: ${testEmail}`);

    console.log("\n🚀 Next Steps:");
    console.log("  1. Implement email verification in registration");
    console.log("  2. Set up user approval workflow");
    console.log("  3. Test password reset with Resend");
    console.log("  4. Build admin notification system");
  } catch (error) {
    console.error("\n❌ Error testing Resend:", error.message);

    if (error.message.includes("API key")) {
      console.log("\n🔧 Troubleshooting:");
      console.log("  - Verify your Resend API key is correct");
      console.log("  - Check that the API key has email sending permissions");
      console.log("  - Make sure your Resend account is active");
    } else if (error.message.includes("domain")) {
      console.log("\n🔧 Domain Setup:");
      console.log("  - Verify your sending domain in Resend dashboard");
      console.log("  - Add DNS records for domain authentication");
      console.log("  - Use a verified domain for from email");
    } else {
      console.log("\n🔧 General Troubleshooting:");
      console.log("  - Check internet connection");
      console.log("  - Verify Resend service status");
      console.log("  - Try again in a few minutes");
    }
  }
}

// Main execution
(async () => {
  await testResendSetup();
})();
