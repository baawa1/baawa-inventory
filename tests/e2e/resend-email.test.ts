import fetch from "node-fetch";
import { test, expect } from "@playwright/test";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL =
  process.env.RESEND_TEST_TO_EMAIL || "baawapay+resendtest@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Helper to send an email using Resend API
async function sendTestEmail() {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: "E2E Test Email",
      html: "<strong>This is a test email for E2E retrieval.</strong>",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to send email: ${res.status} ${res.statusText}`);
  }
  const data: any = await res.json();
  if (!data.id) throw new Error("No email ID returned from Resend");
  return data.id;
}

// Helper to retrieve an email by ID
async function retrieveEmailById(emailId: string) {
  const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to retrieve email: ${res.status} ${res.statusText}`
    );
  }
  return res.json() as Promise<any>;
}

test("should send and retrieve an email using Resend API", async () => {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in environment variables");
  }
  console.log("Sending test email...");
  const emailId = await sendTestEmail();
  console.log("Email sent. ID:", emailId);

  // Wait a bit for delivery
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("Retrieving email...");
  const email: any = await retrieveEmailById(emailId);
  console.log("Retrieved email:", JSON.stringify(email, null, 2));

  expect(email).toHaveProperty("id", emailId);
  expect(email).toHaveProperty("subject", "E2E Test Email");
  expect(email).toHaveProperty("html");
  expect(email.html).toContain("This is a test email for E2E retrieval");
});
