import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Get all admin email addresses for notifications
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
        userStatus: 'APPROVED',
        emailNotifications: true,
      },
      select: {
        email: true,
      },
    });

    return admins?.map(admin => admin.email) || [];
  } catch (error) {
    logger.error('Failed to get admin emails', {
      error: error instanceof Error ? error.message : String(error),
    });
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
      logger.warn('No admin emails found in database, using fallback email', {
        fallbackEmail,
      });
      return [fallbackEmail];
    }
  }

  return adminEmails;
}

/**
 * Send notification to all active admins
 */
export async function notifyAdmins(
  sendNotification: (_emails: string[]) => Promise<void>
): Promise<void> {
  let adminEmails: string[] = [];

  try {
    adminEmails = await getAdminEmailsWithFallback();

    if (adminEmails.length === 0) {
      logger.warn('No admin emails available for notification', {
        notificationType: 'stock-reconciliation',
      });
      return;
    }

    await sendNotification(adminEmails);
    // Debug logging removed for production
  } catch (error) {
    logger.error('Failed to send admin notification', {
      notificationType: 'stock-reconciliation',
      adminCount: adminEmails.length,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw error to prevent breaking the main flow
  }
}
