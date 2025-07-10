import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  status: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  emailVerified: boolean;
}

export class TestDataSetup {
  /**
   * Create a test user for E2E testing
   */
  static async createTestUser(userData: TestUser) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          userStatus: userData.status,
          emailVerified: userData.emailVerified,
          isActive: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error creating test user:", error);
      throw error;
    }
  }

  /**
   * Create a test user with password reset token
   */
  static async createTestUserWithResetToken(
    userData: TestUser,
    resetToken: string
  ) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          userStatus: userData.status,
          emailVerified: userData.emailVerified,
          isActive: true,
          resetToken: resetToken,
          resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });

      return user;
    } catch (error) {
      console.error("Error creating test user with reset token:", error);
      throw error;
    }
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(emailPattern: string = "e2e.test") {
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: emailPattern,
          },
        },
      });

      // Note: AuditLog doesn't have a userEmail field, so we can't clean up by email
      // We'll clean up by user_id instead, but this requires getting the user IDs first
      const testUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: emailPattern,
          },
        },
        select: { id: true },
      });

      const userIds = testUsers.map((user) => user.id);

      if (userIds.length > 0) {
        await prisma.auditLog.deleteMany({
          where: {
            user_id: {
              in: userIds,
            },
          },
        });
      }

      console.log("Test data cleaned up successfully");
    } catch (error) {
      console.error("Error cleaning up test data:", error);
      throw error;
    }
  }

  /**
   * Get test user credentials for common scenarios
   */
  static getTestUserCredentials() {
    return {
      admin: {
        email: "admin@test.com",
        password: "AdminPassword123!",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
        status: "APPROVED" as const,
        emailVerified: true,
      },
      manager: {
        email: "manager@test.com",
        password: "ManagerPassword123!",
        firstName: "Manager",
        lastName: "User",
        role: "MANAGER" as const,
        status: "APPROVED" as const,
        emailVerified: true,
      },
      employee: {
        email: "employee@test.com",
        password: "EmployeePassword123!",
        firstName: "Employee",
        lastName: "User",
        role: "STAFF" as const,
        status: "APPROVED" as const,
        emailVerified: true,
      },
      pending: {
        email: "pending@test.com",
        password: "PendingPassword123!",
        firstName: "Pending",
        lastName: "User",
        role: "STAFF" as const,
        status: "PENDING" as const,
        emailVerified: false,
      },
      suspended: {
        email: "suspended@test.com",
        password: "SuspendedPassword123!",
        firstName: "Suspended",
        lastName: "User",
        role: "STAFF" as const,
        status: "SUSPENDED" as const,
        emailVerified: true,
      },
    };
  }

  /**
   * Setup all test users for E2E testing
   */
  static async setupAllTestUsers() {
    try {
      const credentials = this.getTestUserCredentials();

      // Create all test users
      await Promise.all([
        this.createTestUser(credentials.admin),
        this.createTestUser(credentials.manager),
        this.createTestUser(credentials.employee),
        this.createTestUser(credentials.pending),
        this.createTestUser(credentials.suspended),
      ]);

      console.log("All test users created successfully");
    } catch (error) {
      console.error("Error setting up test users:", error);
      throw error;
    }
  }

  /**
   * Create a test user with reset token for password reset testing
   */
  static async setupPasswordResetTest() {
    try {
      const resetToken = "test-reset-token-123";
      const userData = {
        email: "reset@test.com",
        password: "OldPassword123!",
        firstName: "Reset",
        lastName: "User",
        role: "STAFF" as const,
        status: "APPROVED" as const,
        emailVerified: true,
      };

      await this.createTestUserWithResetToken(userData, resetToken);
      console.log("Password reset test user created successfully");

      return { userData, resetToken };
    } catch (error) {
      console.error("Error setting up password reset test:", error);
      throw error;
    }
  }
}

// Export for use in E2E tests
export default TestDataSetup;
