import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createUserSchema, userQuerySchema } from "@/lib/validations";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { createApiResponse } from "@/lib/api-response";
import { USER_ROLES } from "@/lib/auth/roles";
import { Prisma } from "@prisma/client";

// GET /api/users - List users with optional filtering and pagination
// Requires permission to manage users (ADMIN only)
export const GET = withPermission(
  [USER_ROLES.ADMIN],
  async function (request: AuthenticatedRequest) {
    try {
      const { searchParams } = new URL(request.url);

      // Convert search params to object for validation
      const queryParams = Object.fromEntries(searchParams.entries());

      // Validate query parameters
      const validation = userQuerySchema.safeParse(queryParams);

      if (!validation.success) {
        return createApiResponse.validationError(
          "Invalid query parameters",
          validation.error.issues
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

      // Enforce maximum limit as a safety check
      const safeLimit = Math.min(limit, 100);

      // Calculate offset for pagination
      const skip = (page - 1) * safeLimit;

      // Build where clause for filtering
      const where: Prisma.UserWhereInput = {};

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
      const orderBy: Prisma.UserOrderByWithRelationInput = {};
      if (sortBy === "createdAt") {
        orderBy.createdAt = sortOrder;
      } else {
        orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] =
          sortOrder;
      }

      // Fetch users with Prisma - exclude password from response
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
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
          take: safeLimit,
        }),
        prisma.user.count({ where }),
      ]);

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

      // Return paginated response with metadata
      return createApiResponse.successWithPagination(
        transformedUsers,
        {
          page,
          limit: safeLimit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / safeLimit),
          hasNext: skip + safeLimit < totalCount,
          hasPrev: page > 1,
        },
        `Retrieved ${transformedUsers.length} users`
      );
    } catch (error) {
      console.error("Error in GET /api/users:", error);
      return createApiResponse.internalError("Failed to retrieve users");
    }
  }
);

// POST /api/users - Create a new user
// Requires permission to manage users (ADMIN only)
export const POST = withPermission(
  [USER_ROLES.ADMIN],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = createUserSchema.safeParse(body);
      if (!validation.success) {
        return createApiResponse.validationError(
          "Invalid user data",
          validation.error.issues
        );
      }

      const userData = validation.data;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
        select: { id: true },
      });

      if (existingUser) {
        return createApiResponse.conflict(
          "User with this email already exists"
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

      return createApiResponse.success(
        transformedUser,
        "User created successfully",
        201
      );
    } catch (error) {
      console.error("Error in POST /api/users:", error);
      return createApiResponse.internalError("Internal server error");
    }
  }
);
