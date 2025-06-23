import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = validateTokenSchema.parse(body);

    // Find user with valid reset token using Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, reset_token_expires, is_active")
      .eq("reset_token", token)
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const tokenExpiry = new Date(user.reset_token_expires);
    const now = new Date();

    if (tokenExpiry <= now) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token validation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
