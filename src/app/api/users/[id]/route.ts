import { NextRequest, NextResponse } from "next/server";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { emailService } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission(
    ["ADMIN"],
    async (_authRequest: AuthenticatedRequest) => {
      try {
        const { id } = await params;

        // Validate ID
        const userId = parseInt(id);
        if (isNaN(userId)) {
          return NextResponse.json(
            { error: "Invalid user ID" },
            { status: 400 }
          );
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
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
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
    }
  );

  return handler(request as AuthenticatedRequest);
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission(
    ["ADMIN"],
    async (authRequest: AuthenticatedRequest) => {
      try {
        const { id } = await params;
        const body = await authRequest.json();

        // Debug logging removed for production

        // Validate ID
        const userId = parseInt(id);
        if (isNaN(userId)) {
          return NextResponse.json(
            { error: "Invalid user ID" },
            { status: 400 }
          );
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
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
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
          const validRoles = ["ADMIN", "MANAGER", "STAFF"];
          if (!validRoles.includes(body.role)) {
            return NextResponse.json(
              { error: "Invalid role. Must be one of: ADMIN, MANAGER, STAFF" },
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

        // Debug logging removed for production

        // Update the user
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            ...updateData,
            // Add session refresh tracking if role or status changed
            ...(body.role || body.userStatus
              ? {
                  sessionNeedsRefresh: true,
                  sessionRefreshAt: new Date(),
                }
              : {}),
          },
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

        // Debug logging removed for production

        return NextResponse.json({
          ...transformedUser,
          // Add session refresh flag if role or status changed
          sessionUpdated: !!(body.role || body.userStatus),
        });
      } catch (error) {
        console.error("Error in PUT /api/users/[id]:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  );

  return handler(request as AuthenticatedRequest);
}

// DELETE /api/users/[id] - Delete a user (mark as inactive)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission(
    ["ADMIN"],
    async (_authRequest: AuthenticatedRequest) => {
      try {
        const { id } = await params;

        // Validate ID
        const userId = parseInt(id);
        if (isNaN(userId)) {
          return NextResponse.json(
            { error: "Invalid user ID" },
            { status: 400 }
          );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });

        if (!existingUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // Instead of deleting, mark as inactive
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

        return NextResponse.json({
          message: "User deactivated successfully",
          user,
        });
      } catch (error) {
        console.error("Error in DELETE /api/users/[id]:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  );

  return handler(request as AuthenticatedRequest);
}
