import { Page } from "@playwright/test";

/**
 * Email Test Helpers for E2E Testing
 *
 * Following Resend documentation for E2E testing:
 * https://resend.com/docs/knowledge-base/end-to-end-testing-with-playwright
 */

// Test email addresses from Resend documentation
export const TEST_EMAILS = {
  // These are safe test addresses that won't impact deliverability
  DELIVERED: "delivered@resend.dev",
  BOUNCED: "bounced@resend.dev",
  COMPLAINED: "complained@resend.dev",
  // For our E2E tests, we'll use delivered to simulate successful emails
  DEFAULT_TEST: "delivered@resend.dev",
} as const;

// Mock response data for different email scenarios
export const MOCK_EMAIL_RESPONSES = {
  SUCCESS: {
    data: {
      id: "621f3ecf-f4d2-453a-9f82-21332409b4d2",
      from: "onboarding@baawa.com",
      to: ["delivered@resend.dev"],
      created_at: new Date().toISOString(),
    },
  },
  ERROR: {
    error: {
      message: "Email sending failed",
      code: "EMAIL_SEND_ERROR",
    },
  },
  RATE_LIMITED: {
    error: {
      message: "Rate limit exceeded",
      code: "RATE_LIMITED",
    },
  },
} as const;

export interface EmailTestConfig {
  // Mock all email API calls by default
  mockEmails?: boolean;
  // Response to return for email sends
  mockResponse?:
    | typeof MOCK_EMAIL_RESPONSES.SUCCESS
    | typeof MOCK_EMAIL_RESPONSES.ERROR
    | typeof MOCK_EMAIL_RESPONSES.RATE_LIMITED;
  // Status code for mock response
  statusCode?: number;
  // Delay for mock response
  delayMs?: number;
}

export class EmailTestHelpers {
  private page: Page;
  private mockConfig: Required<EmailTestConfig>;

  constructor(page: Page, config: EmailTestConfig = {}) {
    this.page = page;
    this.mockConfig = {
      mockEmails: config.mockEmails ?? true,
      mockResponse: config.mockResponse ?? MOCK_EMAIL_RESPONSES.SUCCESS,
      statusCode: config.statusCode ?? 200,
      delayMs: config.delayMs ?? 100,
    };
  }

  /**
   * Set up email API mocking for the test
   */
  async setupEmailMocking(): Promise<void> {
    if (!this.mockConfig.mockEmails) {
      return;
    }

    // Mock all email-related API endpoints
    await this.page.route("**/api/auth/register", async (route) => {
      // Mock registration endpoint to simulate email sending
      await this.mockEmailResponse(route);
    });

    await this.page.route("**/api/auth/forgot-password", async (route) => {
      // Mock forgot password endpoint
      await this.mockEmailResponse(route);
    });

    await this.page.route("**/api/auth/verify-email", async (route) => {
      if (route.request().method() === "PUT") {
        // Mock resend verification email
        await this.mockEmailResponse(route);
      } else {
        // Let verification requests through for testing
        await route.continue();
      }
    });

    // Mock any direct email API calls
    await this.page.route("**/emails/send", async (route) => {
      await this.mockEmailResponse(route);
    });

    console.log("Email mocking set up successfully");
  }

  /**
   * Mock successful email sending
   */
  async mockSuccessfulEmail(): Promise<void> {
    this.mockConfig.mockResponse = MOCK_EMAIL_RESPONSES.SUCCESS;
    this.mockConfig.statusCode = 200;
  }

  /**
   * Mock email sending failure
   */
  async mockEmailFailure(): Promise<void> {
    this.mockConfig.mockResponse = MOCK_EMAIL_RESPONSES.ERROR;
    this.mockConfig.statusCode = 500;
  }

  /**
   * Mock rate limiting
   */
  async mockRateLimit(): Promise<void> {
    this.mockConfig.mockResponse = MOCK_EMAIL_RESPONSES.RATE_LIMITED;
    this.mockConfig.statusCode = 429;
  }

  /**
   * Disable email mocking (use real API)
   */
  async disableEmailMocking(): Promise<void> {
    this.mockConfig.mockEmails = false;
    // Clear existing routes
    await this.page.unroute("**/api/auth/register");
    await this.page.unroute("**/api/auth/forgot-password");
    await this.page.unroute("**/api/auth/verify-email");
    await this.page.unroute("**/emails/send");
  }

  /**
   * Generate a test email address
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}@resend.dev`;
  }

  /**
   * Get a safe test email address
   */
  static getTestEmail(type: keyof typeof TEST_EMAILS = "DEFAULT_TEST"): string {
    return TEST_EMAILS[type];
  }

  /**
   * Private helper to mock email response
   */
  private async mockEmailResponse(route: any): Promise<void> {
    // Add delay if configured
    if (this.mockConfig.delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.mockConfig.delayMs)
      );
    }

    // Get the original request body to potentially modify the response
    const requestBody = route.request().postDataJSON();

    // Create response based on configuration
    const response = { ...this.mockConfig.mockResponse };

    // If it's a success response and we have email data, customize it
    if (
      this.mockConfig.statusCode === 200 &&
      "data" in response &&
      requestBody?.email
    ) {
      response.data = {
        ...response.data,
        to: [requestBody.email],
      };
    }

    await route.fulfill({
      status: this.mockConfig.statusCode,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  }

  /**
   * Verify that an email was "sent" by checking for success messages
   */
  async verifyEmailSent(
    page: Page,
    expectedMessage?: string
  ): Promise<boolean> {
    try {
      const defaultMessage = expectedMessage || "email has been sent";
      await page.waitForSelector(`text*=${defaultMessage}`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify email sending failed by checking for error messages
   */
  async verifyEmailFailed(
    page: Page,
    expectedError?: string
  ): Promise<boolean> {
    try {
      const defaultError = expectedError || "Failed to send email";
      await page.waitForSelector(`text*=${defaultError}`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for email-related loading states to complete
   */
  async waitForEmailOperation(page: Page, timeout = 10000): Promise<void> {
    // Wait for common loading indicators to disappear
    await page.waitForFunction(
      () => {
        const loadingIndicators = [
          'text="Sending..."',
          'text="Registering..."',
          'text="Loading..."',
          '[data-testid*="loading"]',
          ".animate-spin",
        ];

        for (const indicator of loadingIndicators) {
          if (document.querySelector(indicator)) {
            return false;
          }
        }
        return true;
      },
      { timeout }
    );
  }
}

/**
 * Utility function to set up basic email mocking for a test
 */
export async function setupBasicEmailMocking(
  page: Page
): Promise<EmailTestHelpers> {
  const emailHelper = new EmailTestHelpers(page, {
    mockEmails: true,
    mockResponse: MOCK_EMAIL_RESPONSES.SUCCESS,
    statusCode: 200,
  });

  await emailHelper.setupEmailMocking();
  return emailHelper;
}

/**
 * Utility function to test email error scenarios
 */
export async function setupEmailErrorTesting(
  page: Page
): Promise<EmailTestHelpers> {
  const emailHelper = new EmailTestHelpers(page, {
    mockEmails: true,
    mockResponse: MOCK_EMAIL_RESPONSES.ERROR,
    statusCode: 500,
  });

  await emailHelper.setupEmailMocking();
  return emailHelper;
}
