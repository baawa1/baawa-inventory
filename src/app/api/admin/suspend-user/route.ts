import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { emailService } from "@/lib/email";
import { z } from "zod";

const suspendUserSchema = z.object({
  userId: z.number(),
  reason: z.string().min(1, "Suspension reason is required"),
  action: z.enum(["suspend", "reactivate"]),
});

// POST /api/admin/suspend-user - Suspend or reactivate a user
export const POST = withPermission(
  ["ADMIN"],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      console.log("POST /api/admin/suspend-user - Received data:", body);

      // Validate request body
      const validation = suspendUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.issues },
          { status: 400 }
        );
      }

      const { userId, reason, action } = validation.data;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userStatus: true,
        },
      });

      if (!user) {
        console.error("User not found:", userId);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Prevent suspending already suspended users or reactivating active users
      if (action === "suspend" && user.userStatus === "SUSPENDED") {
        return NextResponse.json(
          { error: "User is already suspended" },
          { status: 400 }
        );
      }

      if (action === "reactivate" && user.userStatus !== "SUSPENDED") {
        return NextResponse.json(
          { error: "User is not currently suspended" },
          { status: 400 }
        );
      }

      // Update user status
      const newStatus = action === "suspend" ? "SUSPENDED" : "APPROVED";
      await prisma.user.update({
        where: { id: userId },
        data: {
          userStatus: newStatus,
          isActive: action === "reactivate",
          // Add session refresh tracking
          sessionNeedsRefresh: true,
          sessionRefreshAt: new Date(),
        },
      });

      // Send notification email
      try {
        if (action === "suspend") {
          await emailService.sendUserSuspensionEmail(user.email, {
            firstName: user.firstName,
            lastName: user.lastName,
            reason,
          });
        } else {
          await emailService.sendUserReactivationEmail(user.email, {
            firstName: user.firstName,
            lastName: user.lastName,
          });
        }
      } catch (emailError) {
        console.error(`Error sending ${action} email:`, emailError);
        // Don't fail the request if email fails
      }

      const actionText = action === "suspend" ? "suspended" : "reactivated";
      console.log(`✅ User ${userId} successfully ${actionText}`);

      return NextResponse.json({
        success: true,
        message: `User ${actionText} successfully`,
        data: {
          userId,
          status: newStatus,
          action,
          reason,
        },
        // Add session refresh flag
        sessionUpdated: true,
      });
    } catch (error) {
      console.error("Error in POST /api/admin/suspend-user:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
