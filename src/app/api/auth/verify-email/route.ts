import { NextRequest, NextResponse } from "next/server";
import { withAuthRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { AuthenticationService } from "@/lib/auth-service";

// Validation schemas
const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resendEmailSchema = z.object({
  email: z.string().email("Valid email is required"),
});

async function handleVerifyEmail(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifyTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }
    const { token } = validation.data;
    const authService = new AuthenticationService();
    const result = await authService.verifyEmail(token);
    if (result.success) {
      return NextResponse.json(
        {
          message: result.message,
          user: result.user,
          shouldRefreshSession: result.shouldRefreshSession,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.error || "Verification failed" },
        {
          status:
            result.error === "Invalid or expired verification token" ||
            result.error === "Email is already verified"
              ? 400
              : 500,
        }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/auth/verify-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleResendVerification(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resendEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }
    const { email } = validation.data;
    const authService = new AuthenticationService();
    const result = await authService.resendVerificationEmail(email);
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to resend verification email" },
        { status: result.error === "User not found" ? 404 : 400 }
      );
    }
  } catch (error) {
    console.error("Error in PUT /api/auth/verify-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting to both endpoints
export const POST = withAuthRateLimit(handleVerifyEmail);
export const PUT = withAuthRateLimit(handleResendVerification);
