import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find user with valid reset token using Supabase
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, reset_token_expires, is_active")
      .eq("reset_token", token)
      .eq("is_active", true)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const tokenExpiry = new Date(user.reset_token_expires);
    const now = new Date();

    if (tokenExpiry <= now) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with new password and clear reset token using Supabase
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
