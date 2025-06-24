/**
 * Simple Resend Configuration Test
 * This script checks environment variables and basic setup
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

function checkEnvironmentVariables() {
  console.log("🔍 Checking environment variables...\n");

  const requiredVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL,
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
  };

  const optionalVars = {
    TEST_EMAIL: process.env.TEST_EMAIL,
    NODE_ENV: process.env.NODE_ENV,
  };

  console.log("Required variables:");
  let allRequiredSet = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    const status = value ? "✅" : "❌";
    const displayValue = value
      ? key === "RESEND_API_KEY"
        ? "[SET]"
        : value
      : "NOT SET";
    console.log(`  ${status} ${key}: ${displayValue}`);
    if (!value) allRequiredSet = false;
  }

  console.log("\nOptional variables:");
  for (const [key, value] of Object.entries(optionalVars)) {
    const status = value ? "✅" : "⚪";
    console.log(`  ${status} ${key}: ${value || "NOT SET"}`);
  }

  if (!allRequiredSet) {
    console.log("\n⚠️  Some required environment variables are missing.");
    console.log("\nTo complete Resend setup:");
    console.log("1. Add your Resend API key to .env.local:");
    console.log('   RESEND_API_KEY="your_actual_resend_api_key_here"');
    console.log("2. Set a from email:");
    console.log('   RESEND_FROM_EMAIL="noreply@yourdomain.com"');
    console.log("3. Set a from name:");
    console.log('   RESEND_FROM_NAME="Your App Name"');
    console.log(
      "\nAfter setting these variables, restart your development server."
    );
    return false;
  }

  console.log("\n✅ All required environment variables are set!");
  return true;
}

async function testResendConnection() {
  console.log("\n🧪 Testing Resend connection...");

  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Test with a simple API call
    const result = await resend.domains.list();

    if (result.error) {
      console.log("❌ Resend API error:", result.error.message);
      return false;
    }

    console.log("✅ Resend module loaded and API key validated");
    console.log("✅ Ready to send emails via Resend");

    if (result.data && result.data.length > 0) {
      console.log("📋 Verified domains:");
      result.data.forEach((domain) => {
        console.log(`   - ${domain.name} (${domain.status})`);
      });
    } else {
      console.log(
        "📋 No verified domains found (you can still send from resend.dev)"
      );
    }

    return true;
  } catch (error) {
    console.log("❌ Error testing Resend:", error.message);
    console.log("\nTroubleshooting:");
    console.log("- Make sure resend package is installed: npm install resend");
    console.log("- Check that your API key is valid");
    console.log("- Visit https://resend.com/api-keys to verify your key");
    return false;
  }
}

function showNextSteps() {
  console.log("\n🎉 Resend setup is ready!");
  console.log("\nNext steps:");
  console.log("1. ✅ Resend package installed");
  console.log("2. ✅ Environment variables configured");
  console.log("3. ✅ Email service updated to use Resend");
  console.log("4. 🔄 Test sending an actual email (optional)");
  console.log("5. 🚀 Implement email verification in registration flow");
  console.log("6. 🔧 Build admin approval workflow");

  console.log("\nUseful commands:");
  console.log("- Test configuration: node scripts/test-resend-simple.js");
  console.log("- Test email sending: node scripts/test-resend-email.js");
  console.log("- Start development server: npm run dev");

  console.log("\n📧 Email advantages with Resend:");
  console.log("- Modern API with excellent TypeScript support");
  console.log("- Built-in React Email template support");
  console.log("- Better deliverability and analytics");
  console.log("- Generous free tier (3,000 emails/month)");
}

// Main execution
(async () => {
  console.log("🚀 Resend Configuration Test\n");

  const envCheck = checkEnvironmentVariables();
  if (envCheck) {
    const connectionTest = await testResendConnection();
    if (connectionTest) {
      showNextSteps();
    }
  }
})();
