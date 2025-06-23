import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";
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

    // Create the user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        is_active: true,
      })
      .select("id, first_name, last_name, email, role, is_active, created_at")
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Return success without password
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
        },
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
