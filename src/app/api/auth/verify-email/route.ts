import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Find user with this verification token
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, first_name, email_verification_expires, user_status")
      .eq("email_verification_token", token)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.email_verification_expires);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.user_status !== "PENDING") {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Update user as email verified
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        email_verification_token: null,
        email_verification_expires: null,
        user_status: "VERIFIED", // Email verified, but still needs admin approval
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user verification status:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Email verified successfully! Your account is now pending admin approval.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        status: "VERIFIED",
        emailVerified: true,
      },
      // Indicate that the client should refresh the session
      shouldRefreshSession: true,
    });
  } catch (error) {
    console.error("Error in POST /api/auth/verify-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Generate new verification token for existing user
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, first_name, email, user_status, email_verified")
      .eq("email", email)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.email_verified || user.user_status !== "PENDING") {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating verification token:", updateError);
      return NextResponse.json(
        { error: "Failed to generate new verification token" },
        { status: 500 }
      );
    }

    // Send new verification email
    try {
      const { emailService } = await import("@/lib/email");
      const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;

      await emailService.sendVerificationEmail(email, {
        firstName: user.first_name,
        verificationLink,
        expiresInHours: 24,
      });

      return NextResponse.json({
        message: "New verification email sent successfully!",
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in PUT /api/auth/verify-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
