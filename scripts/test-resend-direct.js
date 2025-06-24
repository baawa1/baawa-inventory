#!/usr/bin/env node

/**
 * Direct test of Resend API with the new key
 */

async function testResendAPI() {
  try {
    console.log("🧪 Testing Resend API directly...\n");

    // Test with curl to the Resend API
    const { spawn } = require("child_process");
    require("dotenv").config({ path: ".env.local" });

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.error("❌ Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
      return;
    }

    console.log("📤 Sending test email via Resend API...");

    const testPayload = {
      from: fromEmail,
      to: ["baawapay+test-resend@gmail.com"],
      subject: "Test Email - Resend API Configuration",
      html:
        "<h1>Test Email</h1><p>This is a test email to verify the Resend API configuration is working.</p><p>Timestamp: " +
        new Date().toISOString() +
        "</p>",
    };

    console.log("📋 Test payload:");
    console.log(JSON.stringify(testPayload, null, 2));
    console.log("");

    // Use Node.js fetch (available in Node 18+)
    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Email sent successfully!");
      console.log("📧 Email ID:", result.id);
      console.log("📬 Check baawapay+test-resend@gmail.com for the test email");
    } else {
      console.log("❌ Failed to send email:");
      console.log("Status:", response.status);
      console.log("Error:", result);
    }
  } catch (error) {
    console.error("❌ Error testing Resend API:", error);
    console.log("");
    console.log("💡 Troubleshooting:");
    console.log("1. Check if the RESEND_API_KEY is valid");
    console.log("2. Verify the domain is properly configured in Resend");
    console.log("3. Make sure the from email is verified");
  }
}

testResendAPI();
