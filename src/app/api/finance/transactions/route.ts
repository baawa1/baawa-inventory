import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { error: "Finance features are under development" },
    { status: 501 }
  );
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Finance features are under development" },
    { status: 501 }
  );
}
