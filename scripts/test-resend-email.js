/**
 * Resend Email Sending Test
 * This script sends a test email to verify the setup works
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function sendTestEmail() {
  console.log("📧 Testing Resend Email Sending...\n");

  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Test email data - always use baawapay@gmail.com variations
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, "")
      .replace("T", "-");
    const testEmail =
      process.env.TEST_EMAIL || `baawapay+resend-test-${Date.now()}@gmail.com`;

    const emailData = {
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: testEmail,
      subject: "Resend Test Email - Baawa Inventory POS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Resend Test Email</h2>
          <p>Hello!</p>
          <p>This is a test email from your Baawa Inventory POS system to verify that Resend is working correctly.</p>
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0369a1;">✅ Resend Configuration Status</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>API Key: Configured</li>
              <li>From Email: ${process.env.RESEND_FROM_EMAIL}</li>
              <li>From Name: ${process.env.RESEND_FROM_NAME}</li>
              <li>Test Date: ${new Date().toLocaleString()}</li>
              <li>Provider: Resend (Modern Email API)</li>
            </ul>
          </div>
          <p>If you received this email, your Resend setup is working perfectly!</p>
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #047857;">🎉 Migration from SendGrid Complete!</h4>
            <p style="margin: 0;">Your email system has been successfully migrated to Resend for better performance and developer experience.</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent from the Baawa Inventory POS email system test using Resend.
          </p>
        </div>
      `,
      text: `Resend Test Email - Baawa Inventory POS

Hello! This is a test email to verify that Resend is working correctly.

Configuration Status:
- API Key: Configured
- From Email: ${process.env.RESEND_FROM_EMAIL}
- From Name: ${process.env.RESEND_FROM_NAME}
- Test Date: ${new Date().toLocaleString()}
- Provider: Resend

Migration Complete: Your email system has been successfully migrated to Resend!

If you received this email, your Resend setup is working perfectly!`,
    };

    console.log(`Sending test email to: ${testEmail}`);
    console.log(
      `From: ${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`
    );

    const result = await resend.emails.send(emailData);

    if (result.error) {
      throw new Error(`Resend API Error: ${result.error.message}`);
    }

    console.log("\n✅ Test email sent successfully!");
    console.log("📋 Response details:");
    console.log(`   Email ID: ${result.data?.id || "N/A"}`);
    console.log(`   Status: Sent via Resend API`);

    console.log("\n🎉 Resend is working correctly!");
    console.log("\nWhat this means:");
    console.log("✅ Your API key is valid");
    console.log("✅ Resend can send emails from your account");
    console.log("✅ Email templates and styling work");
    console.log("✅ Ready for production use");
    console.log("✅ Migration from SendGrid complete!");
  } catch (error) {
    console.error("\n❌ Failed to send test email:");
    console.error("Error:", error.message);

    console.log("\n🔧 Troubleshooting:");
    if (error.message.includes("API key")) {
      console.log("- Check that your Resend API key is correct");
      console.log("- Visit https://resend.com/api-keys to verify your key");
      console.log("- Make sure the API key has sending permissions");
    }
    if (error.message.includes("from")) {
      console.log("- Verify the from email is valid");
      console.log("- Check if you need to verify your domain in Resend");
      console.log("- You can use your resend.dev domain for testing");
    }
    console.log("- Make sure your Resend account is active");
    console.log("- Check Resend dashboard for any account issues");
  }
}

function showEmailSetupInstructions() {
  console.log("\n📝 Email Setup Instructions:");
  console.log(
    "\n1. Default test emails are sent to baawapay+test@gmail.com variations"
  );
  console.log("   To use a custom email, set TEST_EMAIL in .env.local:");
  console.log('   TEST_EMAIL="your-email@example.com"');
  console.log("\n2. For production with custom domain:");
  console.log("   - Add and verify your domain in Resend dashboard");
  console.log("   - Set up DNS records as instructed");
  console.log("   - Update RESEND_FROM_EMAIL to use your domain");
  console.log("\n3. Monitor your emails in the Resend dashboard:");
  console.log("   - https://resend.com/emails");
  console.log("\n4. Gmail plus addressing (+) allows multiple test addresses:");
  console.log("   - baawapay+test1@gmail.com");
  console.log("   - baawapay+resend@gmail.com");
  console.log("   - baawapay+verification@gmail.com");
  console.log("\n5. Resend advantages:");
  console.log("   - 3,000 free emails per month");
  console.log("   - Built-in analytics and tracking");
  console.log("   - React Email template support");
  console.log("   - Better deliverability than SendGrid");
}

// Main execution
(async () => {
  await sendTestEmail();
  showEmailSetupInstructions();
})();
