import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    // List of NextAuth cookies to clear
    const authCookies = [
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url",
      "next-auth.pkce.code_verifier",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.csrf-token",
      "__Secure-next-auth.callback-url",
      "__next_hmr_refresh_hash__",
    ];

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear cookies in the response
    authCookies.forEach((cookieName) => {
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        domain: undefined,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      });
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}
