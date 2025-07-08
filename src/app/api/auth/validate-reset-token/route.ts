import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthenticationService } from "@/lib/auth-service";

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = validateTokenSchema.parse(body);
    const authService = new AuthenticationService();
    const result = await authService.validateResetToken(token);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired token" },
        { status: 400 }
      );
    }
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token validation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
