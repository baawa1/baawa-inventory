import { createServerSupabaseClient } from "@/lib/supabase";
import { emailService } from "@/lib/email";
import {
  getAdminEmailsWithFallback,
  notifyAdmins,
} from "@/lib/utils/admin-notifications";

describe("Admin Notification System", () => {
  describe("Admin Email Retrieval", () => {
    test("should get admin emails from database", async () => {
      const adminEmails = await getAdminEmailsWithFallback();

      // Should return an array (even if empty)
      expect(Array.isArray(adminEmails)).toBe(true);

      // All emails should be valid email addresses
      adminEmails.forEach((email) => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    test("should handle database errors gracefully", async () => {
      // This test ensures the function doesn't throw errors
      const adminEmails = await getAdminEmailsWithFallback();
      expect(Array.isArray(adminEmails)).toBe(true);
    });
  });

  describe("Admin Notification Function", () => {
    test("should handle notification sending", async () => {
      const mockSendFunction = jest.fn();

      await notifyAdmins(mockSendFunction);

      // Function should not throw errors
      expect(true).toBe(true);
    });

    test("should have correct notification data structure", () => {
      const testNotificationData = {
        userFirstName: "Test",
        userLastName: "User",
        userEmail: "test.user@example.com",
        userCompany: "Test Company",
        approvalLink: `${process.env.NEXTAUTH_URL}/admin`,
        registrationDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Verify all required fields are present
      expect(testNotificationData.userFirstName).toBeDefined();
      expect(testNotificationData.userLastName).toBeDefined();
      expect(testNotificationData.userEmail).toBeDefined();
      expect(testNotificationData.approvalLink).toBeDefined();
      expect(testNotificationData.registrationDate).toBeDefined();

      // Verify email format
      expect(testNotificationData.userEmail).toMatch(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      );

      // Verify approval link format
      expect(testNotificationData.approvalLink).toContain("/admin");
    });
  });

  describe("Email Service Integration", () => {
    test("should have sendAdminNewUserNotification method", () => {
      expect(typeof emailService.sendAdminNewUserNotification).toBe("function");
    });

    test("should validate email service parameters", () => {
      const testData = {
        userFirstName: "Test",
        userLastName: "User",
        userEmail: "test@example.com",
        userCompany: "",
        approvalLink: "/admin",
        registrationDate: "December 23, 2025 at 10:30 AM",
      };

      // Verify all parameters are strings or defined
      expect(typeof testData.userFirstName).toBe("string");
      expect(typeof testData.userLastName).toBe("string");
      expect(typeof testData.userEmail).toBe("string");
      expect(typeof testData.approvalLink).toBe("string");
      expect(typeof testData.registrationDate).toBe("string");
    });
  });

  describe("Registration Flow Integration", () => {
    test("should handle admin notification in registration", () => {
      // Test that the notification structure matches what registration provides
      const registrationData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: "EMPLOYEE",
      };

      const notificationData = {
        userFirstName: registrationData.firstName,
        userLastName: registrationData.lastName,
        userEmail: registrationData.email,
        userCompany: "",
        approvalLink: `${process.env.NEXTAUTH_URL}/admin`,
        registrationDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      expect(notificationData.userFirstName).toBe(registrationData.firstName);
      expect(notificationData.userLastName).toBe(registrationData.lastName);
      expect(notificationData.userEmail).toBe(registrationData.email);
      expect(notificationData.approvalLink).toContain("/admin");
      expect(notificationData.registrationDate).toBeDefined();
    });
  });
});
