import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email/service";
import { AuditLogger } from "@/lib/utils/audit-logger";
import { emailSchema } from "@/lib/validations/common";
import { randomBytes } from "crypto";
import { withRateLimit } from "@/lib/rate-limiting";

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: emailSchema,
});

async function forgotPasswordHandler(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid email format",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists and is eligible
    if (
      user &&
      user.isActive &&
      user.emailVerified &&
      user.userStatus === "APPROVED"
    ) {
      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires,
        },
      });

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, {
        firstName: user.firstName,
        resetLink: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`,
        expiresInHours: 2,
      });

      // Log password reset request
      await AuditLogger.logPasswordResetRequest(user.email, request);
    } else {
      // Log failed password reset request for security monitoring
      await AuditLogger.logAuthEvent(
        {
          action: "PASSWORD_RESET_REQUEST",
          userEmail: email,
          success: false,
          errorMessage: user
            ? `User not eligible: active=${user.isActive}, verified=${user.emailVerified}, status=${user.userStatus}`
            : "User not found",
        },
        request
      );
    }

    // Always return success message to prevent enumeration
    return NextResponse.json(
      {
        message:
          "If an account with this email exists, a password reset link has been sent.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    // Log the error
    await AuditLogger.logAuthEvent(
      {
        action: "PASSWORD_RESET_REQUEST",
        userEmail: body?.email,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
      request
    );

    return NextResponse.json(
      { error: "Failed to process password reset request. Please try again." },
      { status: 500 }
    );
  }
}

// Apply rate limiting (3 requests per hour per IP)
export const POST = withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 requests per hour
  keyGenerator: (request) => {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    return `forgot-password:${ip}`;
  },
})(forgotPasswordHandler);
