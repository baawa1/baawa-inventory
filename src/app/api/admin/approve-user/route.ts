import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";

import { z } from "zod";
import { validateRequest } from "@/lib/validations";
import { emailService } from "@/lib/email";

// Schema for admin user approval/rejection
const userApprovalSchema = z.object({
  userId: z.number().int().positive(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

// POST /api/admin/approve-user - Approve or reject a user
// Requires admin permission and rate limiting
export const POST = withPermission(
  ["ADMIN"],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = validateRequest(userApprovalSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.errors },
          { status: 400 }
        );
      }

      const { userId, action, rejectionReason } = validation.data!;

      // User is guaranteed to exist when using withPermission
      if (!request.user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      const adminId = request.user.id;

      // Check if user exists and is in a valid state for approval/rejection
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userStatus: true,
          emailVerified: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user is in a valid state for approval/rejection
      if (user.userStatus !== "VERIFIED" && user.userStatus !== "PENDING") {
        return NextResponse.json(
          {
            error:
              "User must be in VERIFIED or PENDING status to be approved/rejected",
          },
          { status: 400 }
        );
      }

      // If rejecting, require a reason
      if (action === "reject" && !rejectionReason?.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required when rejecting a user" },
          { status: 400 }
        );
      }

      // Update user status
      const updateData: any = {
        approvedBy: parseInt(adminId),
        approvedAt: new Date(),
      };

      if (action === "approve") {
        updateData.userStatus = "APPROVED";
        updateData.rejectionReason = null;
      } else {
        updateData.userStatus = "REJECTED";
        updateData.rejectionReason = rejectionReason;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userStatus: true,
          approvedAt: true,
          rejectionReason: true,
        },
      });

      // Send notification email to user about approval/rejection
      try {
        const adminName = request.user.name || "Administrator";
        const supportEmail = process.env.SUPPORT_EMAIL || "support@baawa.com";
        const dashboardUrl =
          process.env.NEXTAUTH_URL || "http://localhost:3000";

        if (action === "approve") {
          // Send approval notification
          await emailService.sendUserApprovalEmail(updatedUser.email, {
            firstName: updatedUser.firstName,
            adminName,
            dashboardLink: `${dashboardUrl}/dashboard`,
            role: user.role || "STAFF",
          });

          // Send welcome email as well
          await emailService.sendWelcomeEmail(updatedUser.email, {
            firstName: updatedUser.firstName,
            email: updatedUser.email,
            companyName: "Baawa Accessories",
          });
        } else {
          await emailService.sendUserRejectionEmail(updatedUser.email, {
            firstName: updatedUser.firstName,
            adminName,
            rejectionReason,
            supportEmail,
          });
        }
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the entire operation if email fails
      }

      return NextResponse.json({
        success: true,
        message: `User ${action === "approve" ? "approved" : "rejected"} successfully`,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          userStatus: updatedUser.userStatus,
          approvedAt: updatedUser.approvedAt,
          rejectionReason: updatedUser.rejectionReason,
        },
      });
    } catch (error) {
      console.error("Error in POST /api/admin/approve-user:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
