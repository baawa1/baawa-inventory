import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { dbService } from "@/lib/db-service";
import { emailService } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await dbService.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user && user.isActive) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database
      await dbService.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetToken,
          resetTokenExpires: resetTokenExpiry,
        },
      });

      // Send email with reset link using the new email service
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

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
