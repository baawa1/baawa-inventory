import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email";
import { TokenSecurity } from "@/lib/utils/token-security";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user) {
      // Generate secure hashed reset token
      const { rawToken, hashedToken } = TokenSecurity.generateSecureToken(32);
      const resetTokenExpiry = TokenSecurity.generateExpiry(1); // 1 hour

      // Save hashed token to database (more secure)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpires: resetTokenExpiry,
        },
      });

      // Send email with raw token (what user will use)
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

      try {
        await emailService.sendPasswordResetEmail(validatedData.email, {
          firstName: user.firstName,
          resetLink: resetUrl,
          expiresInHours: 1,
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        // Don't expose email sending errors to the client
        // In production, you might want to queue this for retry
      }
    }

    // Always return success response (security measure)
    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a reset link has been sent.",
      },
      { status: 200 }
    );
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
