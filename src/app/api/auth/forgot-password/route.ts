import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthenticationService } from "@/lib/auth-service";
import { withAuthRateLimit } from "@/lib/rate-limit";
import { withCSRF } from "@/lib/csrf-protection";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

async function handleForgotPassword(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const authService = new AuthenticationService();
    const result = await authService.requestPasswordReset(validatedData.email);

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting and CSRF protection
export const POST = withAuthRateLimit(withCSRF(handleForgotPassword));
