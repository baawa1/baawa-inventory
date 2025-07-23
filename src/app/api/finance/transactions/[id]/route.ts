import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  _params: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Finance features are under development" },
    { status: 501 }
  );
}

export async function PUT(
  _request: NextRequest,
  _params: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Finance features are under development" },
    { status: 501 }
  );
}

export async function DELETE(
  _request: NextRequest,
  _params: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Finance features are under development" },
    { status: 501 }
  );
}
