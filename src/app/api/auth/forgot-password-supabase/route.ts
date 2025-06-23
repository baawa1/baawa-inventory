import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Check if user exists using Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, is_active")
      .eq("email", validatedData.email)
      .single();

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user && user.is_active && !userError) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database using Supabase
      const { error: updateError } = await supabase
        .from("users")
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpiry.toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to save reset token:", updateError);
        return NextResponse.json(
          { error: "Failed to process request" },
          { status: 500 }
        );
      }

      // Send email with reset link
      const transporter = createTransporter();
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@baawa.com",
        to: validatedData.email,
        subject: "Password Reset Request - BaaWA Inventory",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.first_name},</p>
            <p>You requested a password reset for your BaaWA Inventory account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from BaaWA Inventory Management System.
            </p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
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
