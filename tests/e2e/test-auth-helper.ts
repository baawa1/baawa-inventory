import { test, expect } from "@playwright/test";

export interface TestUser {
  email: string;
  role: string;
  status: string;
  isEmailVerified?: boolean;
}

export class TestAuthHelper {
  /**
   * Set up a test user session by creating a mock session
   */
  static async setupTestUser(page: any, user: TestUser): Promise<void> {
    // Create a mock session that the middleware can read
    await page.addInitScript((userData: TestUser) => {
      // Mock the session data that would normally come from the server
      const mockSession = {
        user: {
          email: userData.email,
          role: userData.role,
          status: userData.status,
          isEmailVerified: userData.isEmailVerified ?? true,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      // Store in sessionStorage to simulate server-side session
      sessionStorage.setItem("auth-session", JSON.stringify(mockSession));

      // Also store in localStorage for backward compatibility
      localStorage.setItem("test-user-email", userData.email);
      localStorage.setItem("test-user-status", userData.status);
      localStorage.setItem("test-user-role", userData.role);
      if (userData.isEmailVerified !== undefined) {
        localStorage.setItem(
          "test-user-email-verified",
          userData.isEmailVerified.toString()
        );
      }
    }, user);

    // Navigate to a page to trigger the script
    await page.goto("/");
  }

  /**
   * Clear test user session
   */
  static async clearTestUser(page: any): Promise<void> {
    await page.addInitScript(() => {
      sessionStorage.removeItem("auth-session");
      localStorage.removeItem("test-user-email");
      localStorage.removeItem("test-user-status");
      localStorage.removeItem("test-user-role");
      localStorage.removeItem("test-user-email-verified");
    });

    await page.goto("/");
  }

  /**
   * Verify user is redirected to expected page based on status
   */
  static async verifyUserAccess(
    page: any,
    user: TestUser,
    expectedRedirect?: string
  ): Promise<void> {
    // Try to access a protected route
    await page.goto("/dashboard");

    if (expectedRedirect) {
      await expect(page).toHaveURL(expectedRedirect);
    } else {
      // Determine expected redirect based on user status
      if (!user.isEmailVerified) {
        await expect(page).toHaveURL("/verify-email");
      } else if (user.status === "PENDING" || user.status === "VERIFIED") {
        await expect(page).toHaveURL("/pending-approval");
      } else if (user.status === "REJECTED" || user.status === "SUSPENDED") {
        await expect(page).toHaveURL("/unauthorized");
      } else if (user.status === "APPROVED") {
        await expect(page).toHaveURL("/dashboard");
      }
    }
  }

  /**
   * Test user access to specific routes
   */
  static async testRouteAccess(
    page: any,
    user: TestUser,
    route: string,
    shouldAllow: boolean
  ): Promise<void> {
    await page.goto(route);

    if (shouldAllow) {
      await expect(page).toHaveURL(route);
    } else {
      // Should be redirected based on user status
      if (!user.isEmailVerified) {
        await expect(page).toHaveURL("/verify-email");
      } else if (user.status === "PENDING" || user.status === "VERIFIED") {
        await expect(page).toHaveURL("/pending-approval");
      } else if (user.status === "REJECTED" || user.status === "SUSPENDED") {
        await expect(page).toHaveURL("/unauthorized");
      }
    }
  }

  /**
   * Common test user configurations
   */
  static readonly TEST_USERS = {
    ADMIN_APPROVED: {
      email: "admin@test.com",
      role: "ADMIN",
      status: "APPROVED",
      isEmailVerified: true,
    },
    MANAGER_APPROVED: {
      email: "manager@test.com",
      role: "MANAGER",
      status: "APPROVED",
      isEmailVerified: true,
    },
    STAFF_APPROVED: {
      email: "staff@test.com",
      role: "STAFF",
      status: "APPROVED",
      isEmailVerified: true,
    },
    VERIFIED_UNAPPROVED: {
      email: "verified@test.com",
      role: "STAFF",
      status: "VERIFIED",
      isEmailVerified: true,
    },
    PENDING: {
      email: "pending@test.com",
      role: "STAFF",
      status: "PENDING",
      isEmailVerified: true,
    },
    UNVERIFIED: {
      email: "unverified@test.com",
      role: "STAFF",
      status: "PENDING",
      isEmailVerified: false,
    },
    REJECTED: {
      email: "rejected@test.com",
      role: "STAFF",
      status: "REJECTED",
      isEmailVerified: true,
    },
    SUSPENDED: {
      email: "suspended@test.com",
      role: "STAFF",
      status: "SUSPENDED",
      isEmailVerified: true,
    },
  };
}
