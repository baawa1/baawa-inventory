import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email";
import { notifyAdmins } from "@/lib/utils/admin-notifications";
import { withAuthRateLimit } from "@/lib/rate-limit";
import { TokenSecurity } from "@/lib/utils/token-security";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { passwordSchema } from "@/lib/validations/common";

// Registration schema - users cannot set their own role for security
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema, // Use strong password requirements
  // Remove role from registration - all self-registered users start as EMPLOYEE
});

async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const userData = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate email verification token
    const {
      rawToken: verificationToken,
      hashedToken: hashedVerificationToken,
      expires: verificationExpires,
    } = TokenSecurity.generateEmailVerificationToken(32);

    // Create the user with email verification fields
    // Security: Force role to EMPLOYEE regardless of input
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        role: "EMPLOYEE", // Force role to EMPLOYEE for security
        isActive: true,
        userStatus: "PENDING",
        emailVerified: false,
        emailVerificationToken: hashedVerificationToken, // Store hashed token
        emailVerificationExpires: verificationExpires,
        emailNotifications: true,
        marketingEmails: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        userStatus: true,
      },
    });

    // Send verification email
    try {
      // Use raw token for email link (user will use this to verify)
      const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;

      await emailService.sendVerificationEmail(userData.email, {
        firstName: userData.firstName,
        verificationLink,
        expiresInHours: 24,
      });

      console.log(`Verification email sent to ${userData.email}`);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails, but log the error
      // User can request a new verification email later
    }

    // Send admin notification for new user registration
    try {
      const approvalLink = `${process.env.NEXTAUTH_URL}/admin`;
      const registrationDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      await notifyAdmins(async (adminEmails) => {
        await emailService.sendAdminNewUserNotification(adminEmails, {
          userFirstName: userData.firstName,
          userLastName: userData.lastName,
          userEmail: userData.email,
          userCompany: "", // Not collected in registration form
          approvalLink,
          registrationDate,
        });
      });

      console.log(`Admin notification sent for new user: ${userData.email}`);
    } catch (notificationError) {
      console.error("Error sending admin notification:", notificationError);
      // Don't fail registration if notification fails
    }

    // Return success with verification message
    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.userStatus,
          emailVerified: false,
        },
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth/register:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting to registration endpoint
export const POST = withAuthRateLimit(handleRegister);
