import { prisma } from "@/lib/db";

/**
 * Get all admin email addresses for notifications
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
        userStatus: "APPROVED",
        emailNotifications: true,
      },
      select: {
        email: true,
      },
    });

    return admins?.map((admin) => admin.email) || [];
  } catch (error) {
    console.error("Error in getAdminEmails:", error);
    return [];
  }
}

/**
 * Get admin email addresses with fallback to environment variable
 */
export async function getAdminEmailsWithFallback(): Promise<string[]> {
  const adminEmails = await getAdminEmails();

  // If no admin emails found in database, use fallback from environment
  if (adminEmails.length === 0) {
    const fallbackEmail =
      process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (fallbackEmail) {
      console.warn(
        "No admin emails found in database, using fallback email:",
        fallbackEmail
      );
      return [fallbackEmail];
    }
  }

  return adminEmails;
}

/**
 * Send notification to all active admins
 */
export async function notifyAdmins(
  sendNotification: (emails: string[]) => Promise<void>
): Promise<void> {
  try {
    const adminEmails = await getAdminEmailsWithFallback();

    if (adminEmails.length === 0) {
      console.warn("No admin emails available for notification");
      return;
    }

    await sendNotification(adminEmails);
    // Debug logging removed for production
  } catch (error) {
    console.error("Error sending admin notification:", error);
    // Don't throw error to prevent breaking the main flow
  }
}
