import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
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
// Requires admin permission
export const POST = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    const supabase = await createServerSupabaseClient();
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
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select(
        "id, user_status, email_verified, first_name, last_name, email, role"
      )
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is in a valid state for approval/rejection
    if (user.user_status !== "VERIFIED" && user.user_status !== "PENDING") {
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
    const updateData: {
      approved_by: string;
      approved_at: string;
      user_status?: string;
      rejection_reason?: string | null;
    } = {
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    };

    if (action === "approve") {
      updateData.user_status = "APPROVED";
      updateData.rejection_reason = null;
    } else {
      updateData.user_status = "REJECTED";
      updateData.rejection_reason = rejectionReason;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select(
        "id, first_name, last_name, email, user_status, approved_at, rejection_reason"
      )
      .single();

    if (updateError) {
      console.error("Error updating user status:", updateError);
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 }
      );
    }

    // Send notification email to user about approval/rejection
    try {
      const adminName = request.user.name || "Administrator";
      const supportEmail = process.env.SUPPORT_EMAIL || "support@baawa.com";
      const dashboardUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

      if (action === "approve") {
        // Send approval notification
        await emailService.sendUserApprovalEmail(updatedUser.email, {
          firstName: updatedUser.first_name,
          adminName,
          dashboardLink: `${dashboardUrl}/dashboard`,
          role: user.role || "STAFF",
        });

        // Send welcome email as well
        await emailService.sendWelcomeEmail(updatedUser.email, {
          firstName: updatedUser.first_name,
          email: updatedUser.email,
          companyName: "Baawa Accessories",
        });
      } else {
        await emailService.sendUserRejectionEmail(updatedUser.email, {
          firstName: updatedUser.first_name,
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
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        userStatus: updatedUser.user_status,
        approvedAt: updatedUser.approved_at,
        rejectionReason: updatedUser.rejection_reason,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/admin/approve-user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
