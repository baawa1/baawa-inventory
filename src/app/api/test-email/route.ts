import { NextResponse } from "next/server";
import { emailService } from "@/lib/email/service";

export async function POST() {
  try {
    // Test email service
    await emailService.sendVerificationEmail("test@example.com", {
      firstName: "Test",
      verificationLink: "http://localhost:3000/verify-email?token=test",
      expiresInHours: 24,
    });

    return NextResponse.json({
      success: true,
      message: "Email service is working",
    });
  } catch (error) {
    console.error("Email service test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
