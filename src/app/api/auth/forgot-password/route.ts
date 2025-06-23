import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase";
import { emailService } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Use the same client approach as registration
    const supabase = await createServerSupabaseClient();

    console.log("🔧 Using server Supabase client (like registration)...");

    // Check if user exists
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", validatedData.email)
      .eq("is_active", true)
      .single();

    console.log("🔍 User lookup result:");
    console.log("📧 Looking for email:", validatedData.email);
    console.log("👤 User found:", !!user);
    console.log("❌ Error:", error?.message || "none");
    if (user) {
      console.log("📊 User details:", {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
      });
    }

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user && !error) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database
      await supabase
        .from("users")
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpiry.toISOString(),
        })
        .eq("id", user.id);

      // Send email with reset link using the new email service
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

      try {
        console.log("🔄 Attempting to send password reset email...");
        console.log("📧 Email:", validatedData.email);
        console.log("🔗 Reset URL:", resetUrl);
        console.log("👤 User name:", user.first_name);

        await emailService.sendPasswordResetEmail(validatedData.email, {
          firstName: user.first_name,
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
