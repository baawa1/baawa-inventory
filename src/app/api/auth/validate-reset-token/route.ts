import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { TokenSecurity } from "@/lib/utils/token-security";

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = validateTokenSchema.parse(body);

    // Find users with non-expired reset tokens
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        resetToken: {
          not: null,
        },
        resetTokenExpires: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        resetToken: true,
      },
    });

    // Check each user's hashed token against the provided token
    let validUser = null;
    for (const user of users) {
      if (user.resetToken && await TokenSecurity.verifyToken(token, user.resetToken)) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
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
