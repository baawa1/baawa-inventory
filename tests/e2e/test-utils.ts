import { test, expect, Page } from "@playwright/test";

export class TestUtils {
  /**
   * Wait for element to be visible with custom timeout
   */
  static async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForSelector(selector, { state: "visible", timeout });
  }

  /**
   * Wait for text to be visible with custom timeout
   */
  static async waitForText(
    page: Page,
    text: string,
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForSelector(`text=${text}`, { state: "visible", timeout });
  }

  /**
   * Wait for URL to match pattern with custom timeout
   */
  static async waitForURL(
    page: Page,
    urlPattern: string | RegExp,
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Fill form field with retry logic
   */
  static async fillField(
    page: Page,
    selector: string,
    value: string,
    retries: number = 3
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await page.fill(selector, value);
        // Verify the value was set
        const actualValue = await page.inputValue(selector);
        if (actualValue === value) {
          return;
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Click element with retry logic
   */
  static async clickElement(
    page: Page,
    selector: string,
    retries: number = 3
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await page.click(selector);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Wait for page to be ready (no loading states)
   */
  static async waitForPageReady(page: Page): Promise<void> {
    // Wait for network to be idle
    await page.waitForLoadState("networkidle");

    // Wait for any loading spinners to disappear
    try {
      await page.waitForSelector('[data-testid="loading"]', {
        state: "hidden",
        timeout: 5000,
      });
    } catch {
      // Loading spinner might not exist, which is fine
    }
  }

  /**
   * Take screenshot on failure
   */
  static async takeScreenshotOnFailure(
    page: Page,
    testName: string
  ): Promise<void> {
    try {
      await page.screenshot({
        path: `test-results/${testName}-failure.png`,
        fullPage: true,
      });
    } catch (error) {
      console.error("Failed to take screenshot:", error);
    }
  }

  /**
   * Generate unique test data
   */
  static generateUniqueEmail(prefix: string = "test"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}@test.com`;
  }

  /**
   * Generate unique test name
   */
  static generateUniqueName(prefix: string = "Test"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Wait for API response
   */
  static async waitForAPIResponse(
    page: Page,
    urlPattern: string | RegExp,
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForResponse(
      (response) => {
        return (
          response
            .url()
            .includes(
              urlPattern.toString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            ) && response.status() === 200
        );
      },
      { timeout }
    );
  }

  /**
   * Clear all form fields
   */
  static async clearForm(page: Page, formSelector: string): Promise<void> {
    const inputs = await page.$$(
      `${formSelector} input, ${formSelector} textarea, ${formSelector} select`
    );
    for (const input of inputs) {
      await input.fill("");
    }
  }

  /**
   * Check if element exists
   */
  static async elementExists(page: Page, selector: string): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to disappear
   */
  static async waitForElementToDisappear(
    page: Page,
    selector: string,
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForSelector(selector, { state: "hidden", timeout });
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i === maxRetries - 1) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Common test data
   */
  static readonly TEST_DATA = {
    VALID_PASSWORD: "SecurePass123!@#",
    WEAK_PASSWORD: "123",
    INVALID_EMAIL: "invalid-email",
    VALID_EMAIL: "test@example.com",
    LONG_NAME: "A".repeat(101),
    SPECIAL_CHARS: "!@#$%^&*()",
  };

  /**
   * Common selectors
   */
  static readonly SELECTORS = {
    LOADING: '[data-testid="loading"]',
    ERROR_MESSAGE: '[data-testid="error-message"]',
    SUCCESS_MESSAGE: '[data-testid="success-message"]',
    SUBMIT_BUTTON: '[data-testid="submit-button"]',
    FORM: '[data-testid="form"]',
  };
}
