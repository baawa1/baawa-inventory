import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthenticationService } from "@/lib/auth-service";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const authService = new AuthenticationService();
    const result = await authService.resetPassword(token, password);

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.error || "Password reset failed" },
        {
          status: result.error === "Invalid or expired reset token" ? 400 : 500,
        }
      );
    }
  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
