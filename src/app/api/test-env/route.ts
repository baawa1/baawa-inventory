import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    resendApiKey: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "NOT SET",
    nextauthSecret: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  });
}
