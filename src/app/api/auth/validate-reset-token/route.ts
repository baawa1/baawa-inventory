import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbService } from "@/lib/db-service";

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = validateTokenSchema.parse(body);

    // Find user with valid reset token
    const user = await dbService.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(), // Token must not be expired
        },
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
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
