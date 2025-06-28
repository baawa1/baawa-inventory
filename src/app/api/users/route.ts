import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  createUserSchema,
  userQuerySchema,
  validateRequest,
} from "@/lib/validations";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";

// GET /api/users - List users with optional filtering and pagination
// Requires permission to manage users (ADMIN only)
export const GET = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    const { searchParams } = new URL(request.url);

    // Convert search params to object for validation
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validation = userQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = validatedData;

    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Apply search filter across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply role filter
    if (role) {
      where.role = role;
    }

    // Apply status filter
    if (status) {
      where.userStatus = status;
    }

    // Apply active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Fetch users with Prisma - exclude password from response
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        userStatus: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    // Transform the response to match the expected camelCase format
    const transformedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      userStatus: user.userStatus,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      approvedBy: user.approvedBy,
      approvedAt: user.approvedAt,
      rejectionReason: user.rejectionReason,
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// POST /api/users - Create a new user
// Requires permission to manage users (ADMIN only)
export const POST = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid user data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const userData = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create the user with Prisma
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.isActive ?? true, // Default to true if not specified
        userStatus: "APPROVED", // New users created by admin are auto-approved
        emailVerified: true, // Admin-created users are auto-verified
        emailVerifiedAt: new Date(), // Set verification timestamp
        notes: userData.notes,
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

    return NextResponse.json(transformedUser, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
