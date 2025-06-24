#!/usr/bin/env node

/**
 * Simple email delivery test
 */

require("dotenv").config({ path: ".env.local" });

async function testEmailDelivery() {
  try {
    console.log("🧪 Testing email delivery...\n");

    // Test environment variables
    console.log("Environment check:");
    console.log(
      `RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "Set" : "Missing"}`
    );
    console.log(
      `FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "Not set"}`
    );
    console.log("");

    // Test Resend API directly
    const { Resend } = require("resend");

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing");
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("📧 Sending test email...");

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@baawa.ng",
      to: ["baawapay+test@gmail.com"],
      subject: "Email Service Test",
      html: "<h1>Email Test</h1><p>This is a test email to verify the service is working.</p>",
      text: "Email Test\n\nThis is a test email to verify the service is working.",
    });

    if (error) {
      console.error("❌ Email sending failed:", error);
    } else {
      console.log("✅ Email sent successfully!");
      console.log("Email ID:", data.id);
    }
  } catch (error) {
    console.error("❌ Error testing email:", error);
  }
}

testEmailDelivery();
