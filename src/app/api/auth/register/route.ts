import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { emailService } from "@/lib/email";
import { notifyAdmins } from "@/lib/utils/admin-notifications";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

// Registration schema - simpler than the admin user creation schema
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
});

type RegisterData = z.infer<typeof registerSchema>;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
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
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the user with email verification fields
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        is_active: true,
        user_status: "PENDING",
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
        email_notifications: true,
        marketing_emails: false,
      })
      .select(
        "id, first_name, last_name, email, role, is_active, created_at, user_status"
      )
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Send verification email
    try {
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
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          status: user.user_status,
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
