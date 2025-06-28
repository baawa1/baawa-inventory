import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    console.log("🔧 Using Prisma for user lookup...");

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

    console.log("🔍 User lookup result:");
    console.log("📧 Looking for email:", validatedData.email);
    console.log("👤 User found:", !!user);
    if (user) {
      console.log("📊 User details:", {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
      });
    }

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetToken,
          resetTokenExpires: resetTokenExpiry,
        },
      });

      // Send email with reset link using the new email service
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

      try {
        console.log("🔄 Attempting to send password reset email...");
        console.log("📧 Email:", validatedData.email);
        console.log("🔗 Reset URL:", resetUrl);
        console.log("👤 User name:", user.firstName);

        await emailService.sendPasswordResetEmail(validatedData.email, {
          firstName: user.firstName,
          resetLink: resetUrl,
          expiresInHours: 1,
        });

        console.log("✅ Password reset email sent successfully");
      } catch (emailError) {
        console.error("❌ Failed to send reset email:", emailError);
        console.error("📧 Email service error details:", {
          message:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          stack: emailError instanceof Error ? emailError.stack : undefined,
          name: emailError instanceof Error ? emailError.name : "Unknown",
        });
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
