import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(req: NextRequest) {
  try {
    const token = await auth();

    return NextResponse.json({
      success: true,
      hasToken: !!token,
      token: token
        ? {
            user: token.user,
            role: (token as any).role,
            status: (token as any).status,
            isEmailVerified: (token as any).isEmailVerified,
            firstName: (token as any).firstName,
            lastName: (token as any).lastName,
          }
        : null,
      headers: Object.fromEntries(req.headers.entries()),
    });
  } catch (error) {
    console.error("Debug token error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
