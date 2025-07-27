import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isEmailVerified: boolean;
}

export class DbTestHelper {
  /**
   * Create a test user in the database
   */
  static async createTestUser(
    user: TestUser,
    password: string = 'SecurePass123!@#'
  ): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        console.log(`User ${user.email} already exists, updating...`);
        await prisma.user.update({
          where: { email: user.email },
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            userStatus: user.status,
            emailVerified: user.isEmailVerified,
            emailVerifiedAt: user.isEmailVerified ? new Date() : null,
          },
        });
      } else {
        console.log(`Creating new user ${user.email}...`);
        await prisma.user.create({
          data: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            userStatus: user.status,
            emailVerified: user.isEmailVerified,
            emailVerifiedAt: user.isEmailVerified ? new Date() : null,
            password: password, // This will be hashed by the auth system
          },
        });
      }
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(
    email: string,
    status: TestUser['status']
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { email },
        data: { userStatus: status },
      });
      console.log(`Updated user ${email} status to ${status}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(
    email: string,
    role: TestUser['role']
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { email },
        data: { role },
      });
      console.log(`Updated user ${email} role to ${role}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Verify user email
   */
  static async verifyUserEmail(email: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { email },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          userStatus: 'VERIFIED', // Move from PENDING to VERIFIED
        },
      });
      console.log(`Verified email for user ${email}`);
    } catch (error) {
      console.error('Error verifying user email:', error);
      throw error;
    }
  }

  /**
   * Approve user
   */
  static async approveUser(email: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { email },
        data: { userStatus: 'APPROVED' },
      });
      console.log(`Approved user ${email}`);
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  }

  /**
   * Delete test user
   */
  static async deleteTestUser(email: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { email },
      });
      console.log(`Deleted test user ${email}`);
    } catch (error) {
      console.error('Error deleting test user:', error);
      // Don't throw error if user doesn't exist
    }
  }

  /**
   * Clean up all test users
   */
  static async cleanupTestUsers(): Promise<void> {
    try {
      const testUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: 'test',
          },
        },
      });

      for (const user of testUsers) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }

      console.log(`Cleaned up ${testUsers.length} test users`);
    } catch (error) {
      console.error('Error cleaning up test users:', error);
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Create common test users
   */
  static async createCommonTestUsers(): Promise<{
    adminUser: TestUser;
    managerUser: TestUser;
    staffUser: TestUser;
    unapprovedUser: TestUser;
  }> {
    const adminUser: TestUser = {
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'APPROVED',
      isEmailVerified: true,
    };

    const managerUser: TestUser = {
      email: 'manager@test.com',
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
      status: 'APPROVED',
      isEmailVerified: true,
    };

    const staffUser: TestUser = {
      email: 'staff@test.com',
      firstName: 'Staff',
      lastName: 'User',
      role: 'STAFF',
      status: 'APPROVED',
      isEmailVerified: true,
    };

    const unapprovedUser: TestUser = {
      email: 'unapproved@test.com',
      firstName: 'Unapproved',
      lastName: 'User',
      role: 'STAFF',
      status: 'VERIFIED',
      isEmailVerified: true,
    };

    // Create all users
    await this.createTestUser(adminUser);
    await this.createTestUser(managerUser);
    await this.createTestUser(staffUser);
    await this.createTestUser(unapprovedUser);

    return {
      adminUser,
      managerUser,
      staffUser,
      unapprovedUser,
    };
  }
}
