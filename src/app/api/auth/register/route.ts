import { NextRequest, NextResponse } from "next/server";
import { withAuthRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { AuthenticationService } from "@/lib/auth-service";

import { passwordSchema } from "@/lib/validations/common";

// Registration schema - users cannot set their own role for security
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema, // Use strong password requirements
  // Remove role from registration - all self-registered users start as EMPLOYEE
});

async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const userData = validation.data;
    const authService = new AuthenticationService();
    const result = await authService.registerUser(userData);

    if (result.success) {
      return NextResponse.json(
        {
          message: result.message,
          user: result.user,
          requiresVerification: result.requiresVerification,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: result.error || "Registration failed" },
        {
          status:
            result.error === "User with this email already exists" ? 409 : 500,
        }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/auth/register:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting to registration endpoint
export const POST = withAuthRateLimit(handleRegister);
