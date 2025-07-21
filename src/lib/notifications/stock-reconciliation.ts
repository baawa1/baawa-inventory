import { prisma } from "@/lib/db";
import { createEmailService } from "@/lib/email";
import { logger } from "@/lib/logger";

export interface NotificationData {
  type:
    | "RECONCILIATION_SUBMITTED"
    | "RECONCILIATION_APPROVED"
    | "RECONCILIATION_REJECTED";
  reconciliationId: number;
  reconciliationTitle: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  comments?: string;
}

export async function sendReconciliationNotification(data: NotificationData) {
  try {
    switch (data.type) {
      case "RECONCILIATION_SUBMITTED":
        await notifyAdminsOfSubmission(data);
        break;
      case "RECONCILIATION_APPROVED":
        await notifyCreatorOfApproval(data);
        break;
      case "RECONCILIATION_REJECTED":
        await notifyCreatorOfRejection(data);
        break;
    }
  } catch (error) {
    logger.error("Failed to send stock reconciliation notification", {
      reconciliationId: data.reconciliationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function notifyAdminsOfSubmission(data: NotificationData) {
  // Get all admin users who have email notifications enabled
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
      emailNotifications: true,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  const subject = `Stock Reconciliation Pending Approval - ${data.reconciliationTitle}`;
  const message = `
    <p>Hello,</p>
    
    <p>A new stock reconciliation has been submitted and requires your approval:</p>
    
    <ul>
      <li><strong>Title:</strong> ${data.reconciliationTitle}</li>
      <li><strong>Submitted by:</strong> ${data.createdBy.firstName} ${data.createdBy.lastName}</li>
      <li><strong>Reconciliation ID:</strong> #${data.reconciliationId}</li>
    </ul>
    
    <p>Please review and approve or reject this reconciliation in the inventory management system.</p>
    
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory/stock-reconciliations/${data.reconciliationId}" 
        style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Review Reconciliation
    </a></p>
    
    <p>Best regards,<br>Inventory Management System</p>
  `;

  // Send to all admins
  const service = createEmailService();
  for (const admin of admins) {
    await service.sendEmail({
      to: admin.email,
      subject,
      html: message,
    });
  }
}

async function notifyCreatorOfApproval(data: NotificationData) {
  const subject = `Stock Reconciliation Approved - ${data.reconciliationTitle}`;
  const message = `
    <p>Hello ${data.createdBy.firstName},</p>
    
    <p>Your stock reconciliation has been approved:</p>
    
    <ul>
      <li><strong>Title:</strong> ${data.reconciliationTitle}</li>
      <li><strong>Reconciliation ID:</strong> #${data.reconciliationId}</li>
      <li><strong>Approved by:</strong> ${data.approvedBy?.firstName} ${data.approvedBy?.lastName}</li>
    </ul>
    
    <p>All stock adjustments have been applied to the inventory.</p>
    
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory/stock-reconciliations/${data.reconciliationId}" 
        style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Details
    </a></p>
    
    <p>Best regards,<br>Inventory Management System</p>
  `;

  const service = createEmailService();
  await service.sendEmail({
    to: data.createdBy.email,
    subject,
    html: message,
  });
}

async function notifyCreatorOfRejection(data: NotificationData) {
  const subject = `Stock Reconciliation Rejected - ${data.reconciliationTitle}`;
  const message = `
    <p>Hello ${data.createdBy.firstName},</p>
    
    <p>Your stock reconciliation has been rejected:</p>
    
    <ul>
      <li><strong>Title:</strong> ${data.reconciliationTitle}</li>
      <li><strong>Reconciliation ID:</strong> #${data.reconciliationId}</li>
      <li><strong>Rejected by:</strong> ${data.approvedBy?.firstName} ${data.approvedBy?.lastName}</li>
      ${data.comments ? `<li><strong>Comments:</strong> ${data.comments}</li>` : ""}
    </ul>
    
    <p>You can edit the reconciliation and resubmit it for approval.</p>
    
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory/stock-reconciliations/${data.reconciliationId}" 
        style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View and Edit
    </a></p>
    
    <p>Best regards,<br>Inventory Management System</p>
  `;

  const service = createEmailService();
  await service.sendEmail({
    to: data.createdBy.email,
    subject,
    html: message,
  });
}
