import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { email, role, status, isEmailVerified } = await request.json();

    // Validate required fields
    if (!email || !role || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a test JWT token
    const testToken = sign(
      {
        user: {
          email,
          role,
          status,
          isEmailVerified: isEmailVerified ?? true,
        },
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      },
      process.env.NEXTAUTH_SECRET || "test-secret",
      { algorithm: "HS256" }
    );

    // Set the token in a cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", testToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return NextResponse.json({
      success: true,
      message: "Test user session created",
      user: { email, role, status, isEmailVerified },
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json(
      { error: "Failed to create test session" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear the test session
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    return NextResponse.json({
      success: true,
      message: "Test user session cleared",
    });
  } catch (error) {
    console.error("Test auth clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear test session" },
      { status: 500 }
    );
  }
}
