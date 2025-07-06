import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { emailService } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission("canManageUsers")(async () => {
    try {
      const { id } = await params;

      // Validate ID
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          userStatus: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Transform response to match expected format
      const transformedUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        userStatus: user.userStatus,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      };

      return NextResponse.json(transformedUser);
    } catch (error) {
      console.error("Error in GET /api/users/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });

  return handler(request as AuthenticatedRequest);
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission("canManageUsers")(async (
    authRequest: AuthenticatedRequest
  ) => {
    try {
      const { id } = await params;
      const body = await authRequest.json();

      console.log("PUT /api/users/[id] - Received data:", { id, body });

      // Validate ID
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          userStatus: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // If email is being updated, check for conflicts
      if (body.email && body.email !== existingUser.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
          return NextResponse.json(
            { error: "Invalid email format" },
            { status: 400 }
          );
        }

        const conflictUser = await prisma.user.findFirst({
          where: {
            email: body.email,
            id: { not: userId },
          },
          select: { id: true },
        });

        if (conflictUser) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 409 }
          );
        }
      }

      // Validate role if provided
      if (body.role) {
        const validRoles = ["ADMIN", "MANAGER", "EMPLOYEE"];
        if (!validRoles.includes(body.role)) {
          return NextResponse.json(
            { error: "Invalid role. Must be one of: ADMIN, MANAGER, EMPLOYEE" },
            { status: 400 }
          );
        }
      }

      // Prepare update data
      const updateData: any = {};

      if (body.firstName) updateData.firstName = body.firstName;
      if (body.lastName) updateData.lastName = body.lastName;
      if (body.email) updateData.email = body.email;
      if (body.role) updateData.role = body.role;
      if (body.phone) updateData.phone = body.phone;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.notes !== undefined) updateData.notes = body.notes;

      // Hash password if provided
      if (body.password && body.password.trim() !== "") {
        updateData.password = await bcrypt.hash(body.password, 12);
      }

      console.log("Updating user with data:", updateData);

      // Update the user
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      // Check if role changed and send notification email
      if (body.role && body.role !== existingUser.role) {
        try {
          const adminName = authRequest.user?.name || "Administrator";
          const dashboardUrl =
            process.env.NEXTAUTH_URL || "http://localhost:3000";

          await emailService.sendRoleChangeEmail(user.email, {
            firstName: user.firstName,
            oldRole: existingUser.role,
            newRole: user.role,
            changedBy: adminName,
            dashboardLink: `${dashboardUrl}/dashboard`,
          });
        } catch (emailError) {
          console.error("Failed to send role change email:", emailError);
          // Don't fail the entire operation if email fails
        }
      }

      // Transform response to match expected format
      const transformedUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      };

      console.log("Successfully updated user:", transformedUser);

      return NextResponse.json(transformedUser);
    } catch (error) {
      console.error("Error in PUT /api/users/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });

  return handler(request as AuthenticatedRequest);
}

// DELETE /api/users/[id] - Deactivate a user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission("canManageUsers")(async (
    authRequest: AuthenticatedRequest
  ) => {
    try {
      const { id } = await params;
      const { searchParams } = new URL(authRequest.url);
      const hardDelete = searchParams.get("hard") === "true";

      // Validate ID
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (hardDelete) {
        // Check for related records that would prevent deletion
        const salesTransactions = await prisma.salesTransaction.findFirst({
          where: { user_id: userId },
          select: { id: true },
        });

        if (salesTransactions) {
          return NextResponse.json(
            {
              error:
                "Cannot delete user with existing sales records. Use deactivation instead.",
            },
            { status: 409 }
          );
        }

        // Hard delete
        await prisma.user.delete({
          where: { id: userId },
        });

        return NextResponse.json({
          message: "User deleted successfully",
        });
      } else {
        // Soft delete (deactivate)
        const user = await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        });

        // Transform response to match expected format
        const transformedUser = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive,
        };

        return NextResponse.json({
          data: transformedUser,
          message: "User deactivated successfully",
        });
      }
    } catch (error) {
      console.error("Error in DELETE /api/users/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });

  return handler(request as AuthenticatedRequest);
}
