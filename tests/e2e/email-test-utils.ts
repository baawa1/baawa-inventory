import { test, expect } from "@playwright/test";
import fetch from "node-fetch";

export interface EmailTestConfig {
  resendApiKey?: string;
  baseEmail?: string;
  waitTime?: number;
}

export class EmailTestUtils {
  private config: EmailTestConfig;

  constructor(config: EmailTestConfig = {}) {
    this.config = {
      resendApiKey: process.env.RESEND_API_KEY,
      baseEmail: "baawapay@gmail.com",
      waitTime: 5000,
      ...config,
    };
  }

  /**
   * Generate a unique test email address
   */
  generateTestEmail(prefix: string = "test"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `baawapay+${prefix}-${timestamp}-${random}@gmail.com`;
  }

  /**
   * Check if Resend API is configured
   */
  isResendConfigured(): boolean {
    return !!this.config.resendApiKey;
  }

  /**
   * Log email information for manual verification
   */
  logEmailInfo(email: string, testName: string): void {
    console.log(`\n📧 ${testName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`📧 Check your Gmail inbox for verification email`);
    console.log(`📧 Gmail filter: "to:${email}"\n`);
  }

  /**
   * Wait for email processing
   */
  async waitForEmailProcessing(page: any): Promise<void> {
    await page.waitForTimeout(this.config.waitTime || 5000);
  }

  /**
   * Verify email success message
   */
  async verifyEmailSuccess(page: any): Promise<void> {
    const successMessage = page.locator("text=Check Your Email!");
    await expect(successMessage).toBeVisible();
  }

  /**
   * Create a test account and return the email
   */
  async createTestAccount(
    page: any,
    firstName: string = "Test",
    lastName: string = "User"
  ): Promise<string> {
    const testEmail = this.generateTestEmail("e2e");

    await page.goto("/register");
    await page.waitForSelector("form");

    // Fill in registration data
    await page.fill('input[name="firstName"]', firstName);
    await page.fill('input[name="lastName"]', lastName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "SecurePass123!@#");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!@#");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to check-email page
    await page.waitForURL(/\/check-email/, { timeout: 10000 });

    // Verify we're on the check-email page
    expect(page.url()).toContain("/check-email");
    expect(page.url()).toContain(`email=${encodeURIComponent(testEmail)}`);

    return testEmail;
  }

  /**
   * Fetch the latest email sent to a given address using the Resend API
   * Note: Resend API doesn't provide a direct endpoint to fetch emails
   * This is a placeholder that logs the email info for manual verification
   */
  async fetchLatestEmail(to: string): Promise<any> {
    if (!this.config.resendApiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }

    // Resend API doesn't provide a way to fetch sent emails
    // We'll create a mock email object for testing purposes
    console.log(`\n📧 Mock email fetch for: ${to}`);
    console.log(
      `📧 Since Resend API doesn't provide email fetching, we'll simulate the verification process`
    );

    // Return a mock email object
    return {
      subject: "Verify your email address",
      html: `<p>Please verify your email by clicking this link: <a href="http://localhost:3000/verify-email?token=mock-verification-token">Verify Email</a></p>`,
      to: to,
      from: "noreply@baawa.com",
      created_at: new Date().toISOString(),
    };
  }
}

// Export a default instance
export const emailUtils = new EmailTestUtils();
