import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email";
import { withAuthRateLimit } from "@/lib/rate-limit";
import { TokenSecurity } from "@/lib/utils/token-security";
import { z } from "zod";

// Validation schemas
const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resendEmailSchema = z.object({
  email: z.string().email("Valid email is required"),
});

async function handleVerifyEmail(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = verifyTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find all users with verification tokens that haven't expired
    const users = await prisma.user.findMany({
      where: {
        emailVerificationToken: { not: null },
        emailVerificationExpires: { gte: new Date() },
        userStatus: "PENDING",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerificationToken: true,
        emailVerificationExpires: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    // Check token against each user's hashed token
    let matchedUser = null;
    for (const user of users) {
      if (user.emailVerificationToken) {
        const isValid = await TokenSecurity.verifyEmailToken(
          token,
          user.emailVerificationToken
        );
        if (isValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (matchedUser.emailVerified || matchedUser.userStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Update user as email verified
    const updatedUser = await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        userStatus: "VERIFIED", // Email verified, but still needs admin approval
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      message:
        "Email verified successfully! Your account is now pending admin approval.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        status: updatedUser.userStatus,
        emailVerified: updatedUser.emailVerified,
      },
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
async function handleResendVerification(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = resendEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        email: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already verified
    if (user.emailVerified || user.userStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const {
      rawToken: verificationToken,
      hashedToken: hashedVerificationToken,
      expires: verificationExpires,
    } = TokenSecurity.generateEmailVerificationToken(32);

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send new verification email
    try {
      const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;

      await emailService.sendVerificationEmail(email, {
        firstName: user.firstName,
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

// Apply rate limiting to both endpoints
export const POST = withAuthRateLimit(handleVerifyEmail);
export const PUT = withAuthRateLimit(handleResendVerification);
