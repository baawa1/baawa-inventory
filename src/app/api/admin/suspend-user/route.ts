import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { emailService } from "@/lib/email";
import { z } from "zod";

const suspendUserSchema = z.object({
  userId: z.number(),
  reason: z.string().min(1, "Suspension reason is required"),
  action: z.enum(["suspend", "reactivate"]),
});

// POST /api/admin/suspend-user - Suspend or reactivate a user
export const POST = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    const supabase = await createServerSupabaseClient();
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
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, user_status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent suspending already suspended users or reactivating active users
    if (action === "suspend" && user.user_status === "SUSPENDED") {
      return NextResponse.json(
        { error: "User is already suspended" },
        { status: 400 }
      );
    }

    if (action === "reactivate" && user.user_status !== "SUSPENDED") {
      return NextResponse.json(
        { error: "User is not currently suspended" },
        { status: 400 }
      );
    }

    // Update user status
    const newStatus = action === "suspend" ? "SUSPENDED" : "APPROVED";
    const { error: updateError } = await supabase
      .from("users")
      .update({
        user_status: newStatus,
        is_active: action === "reactivate",
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user status:", updateError);
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 }
      );
    }

    // Send notification email
    try {
      if (action === "suspend") {
        await emailService.sendUserSuspensionEmail(user.email, {
          firstName: user.first_name,
          lastName: user.last_name,
          reason,
        });
      } else {
        await emailService.sendUserReactivationEmail(user.email, {
          firstName: user.first_name,
          lastName: user.last_name,
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
    });
  } catch (error) {
    console.error("Error in POST /api/admin/suspend-user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
