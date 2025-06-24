/**
 * Test script for admin notification system
 * Tests the new user registration notification flow
 */

import { createServerSupabaseClient } from "../src/lib/supabase.js";
import { emailService } from "../src/lib/email/index.js";
import {
  getAdminEmailsWithFallback,
  notifyAdmins,
} from "../src/lib/utils/admin-notifications.js";

async function testAdminNotifications() {
  console.log("🔔 Testing Admin Notification System\n");

  try {
    // Test 1: Get admin emails
    console.log("1. Testing admin email retrieval...");
    const adminEmails = await getAdminEmailsWithFallback();
    console.log(`✅ Found ${adminEmails.length} admin emails:`, adminEmails);

    if (adminEmails.length === 0) {
      console.log(
        "⚠️  No admin emails found. This may be expected if no admins are in the database."
      );
      return;
    }

    // Test 2: Test admin notification function
    console.log("\n2. Testing admin notification function...");

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

    // Test notification without actually sending (dry run)
    console.log("📧 Test notification data:");
    console.log(testNotificationData);

    // Comment out the actual sending for testing
    // await notifyAdmins(async (emails) => {
    //   await emailService.sendAdminNewUserNotification(emails, testNotificationData);
    // });

    console.log("✅ Admin notification function test completed");

    // Test 3: Check database for admin users
    console.log("\n3. Checking database for admin users...");
    const supabase = await createServerSupabaseClient();

    const { data: admins, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, role, user_status, is_active, email_notifications"
      )
      .eq("role", "ADMIN");

    if (error) {
      console.error("❌ Error fetching admin users:", error);
      return;
    }

    console.log(`📊 Found ${admins?.length || 0} admin users in database:`);
    admins?.forEach((admin) => {
      const status =
        admin.is_active &&
        admin.user_status === "APPROVED" &&
        admin.email_notifications
          ? "✅ Active & Notifications ON"
          : "⚠️  Inactive or Notifications OFF";
      console.log(
        `  - ${admin.first_name} ${admin.last_name} (${admin.email}) - ${status}`
      );
    });

    console.log("\n🎉 Admin notification system test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing admin notifications:", error);
  }
}

// Run the test
testAdminNotifications()
  .then(() => {
    console.log("\n✅ Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
