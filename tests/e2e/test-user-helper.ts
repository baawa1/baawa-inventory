import { execSync } from "child_process";

export interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  userStatus: string;
  emailVerified: boolean;
  isActive: boolean;
}

// Define our test users with their required states (TypeScript version)
export const TEST_USERS = {
  UNVERIFIED: {
    email: "baawapays+test-unverified@gmail.com",
    firstName: "Unverified",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "PENDING",
    emailVerified: false,
    isActive: true,
  },
  VERIFIED_UNAPPROVED: {
    email: "baawapays+test-verified-unapproved@gmail.com",
    firstName: "Verified",
    lastName: "Unapproved",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "VERIFIED",
    emailVerified: true,
    isActive: true,
  },
  APPROVED_ADMIN: {
    email: "baawapays+test-admin@gmail.com",
    firstName: "Admin",
    lastName: "User",
    password: "SecurePassword123!",
    role: "ADMIN",
    userStatus: "APPROVED",
    emailVerified: true,
    isActive: true,
  },
  APPROVED_MANAGER: {
    email: "baawapays+test-manager@gmail.com",
    firstName: "Manager",
    lastName: "User",
    password: "SecurePassword123!",
    role: "MANAGER",
    userStatus: "APPROVED",
    emailVerified: true,
    isActive: true,
  },
  APPROVED_STAFF: {
    email: "baawapays+test-staff@gmail.com",
    firstName: "Staff",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "APPROVED",
    emailVerified: true,
    isActive: true,
  },
  REJECTED: {
    email: "baawapays+test-rejected@gmail.com",
    firstName: "Rejected",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "REJECTED",
    emailVerified: true,
    isActive: false,
  },
  SUSPENDED: {
    email: "baawapays+test-suspended@gmail.com",
    firstName: "Suspended",
    lastName: "User",
    password: "SecurePassword123!",
    role: "STAFF",
    userStatus: "SUSPENDED",
    emailVerified: true,
    isActive: false,
  },
} as const;

export class TestUserHelper {
  private static instance: TestUserHelper;
  private usersInitialized = false;

  private constructor() {}

  static getInstance(): TestUserHelper {
    if (!TestUserHelper.instance) {
      TestUserHelper.instance = new TestUserHelper();
    }
    return TestUserHelper.instance;
  }

  /**
   * Initialize test users by running the reset script
   */
  async initializeTestUsers(): Promise<void> {
    if (this.usersInitialized) {
      return;
    }

    console.log("🔄 Initializing test users...");

    try {
      // Run the reset script
      execSync("node scripts/reset-test-users.js reset", {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      this.usersInitialized = true;
      console.log("✅ Test users initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize test users:", error);
      throw error;
    }
  }

  /**
   * Get a test user by type
   */
  getUser(userType: keyof typeof TEST_USERS): TestUser {
    return TEST_USERS[userType] as TestUser;
  }

  /**
   * Get all test users
   */
  getAllUsers(): Record<string, TestUser> {
    return TEST_USERS as Record<string, TestUser>;
  }

  /**
   * Get users by status
   */
  getUsersByStatus(status: string): TestUser[] {
    return Object.values(TEST_USERS).filter(
      (user) => user.userStatus === status
    );
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: string): TestUser[] {
    return Object.values(TEST_USERS).filter((user) => user.role === role);
  }

  /**
   * Get approved users
   */
  getApprovedUsers(): TestUser[] {
    return this.getUsersByStatus("APPROVED");
  }

  /**
   * Get unverified users
   */
  getUnverifiedUsers(): TestUser[] {
    return this.getUsersByStatus("PENDING");
  }

  /**
   * Get verified but unapproved users
   */
  getVerifiedUnapprovedUsers(): TestUser[] {
    return this.getUsersByStatus("VERIFIED");
  }

  /**
   * Get rejected/suspended users
   */
  getRejectedUsers(): TestUser[] {
    return Object.values(TEST_USERS).filter((user) =>
      ["REJECTED", "SUSPENDED"].includes(user.userStatus)
    );
  }

  /**
   * Clean up test users
   */
  async cleanupTestUsers(): Promise<void> {
    console.log("🧹 Cleaning up test users...");

    try {
      execSync("node scripts/reset-test-users.js cleanup", {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      this.usersInitialized = false;
      console.log("✅ Test users cleaned up successfully");
    } catch (error) {
      console.error("❌ Failed to cleanup test users:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const testUserHelper = TestUserHelper.getInstance();

// Export user types for convenience
export const {
  UNVERIFIED,
  VERIFIED_UNAPPROVED,
  APPROVED_ADMIN,
  APPROVED_MANAGER,
  APPROVED_STAFF,
  REJECTED,
  SUSPENDED,
} = TEST_USERS;
