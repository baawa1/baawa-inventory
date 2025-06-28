import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = validateTokenSchema.parse(body);

    // Use the same client approach as forgot password (which works)
    const supabase = await createServerSupabaseClient();

    console.log("🔐 Validating reset token...");
    console.log("🔑 Token (first 10 chars):", token.substring(0, 10) + "...");

    // Find user with valid reset token using server client
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("reset_token", token)
      .eq("is_active", true)
      .gte("reset_token_expires", new Date().toISOString())
      .single();

    if (!user || error) {
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
