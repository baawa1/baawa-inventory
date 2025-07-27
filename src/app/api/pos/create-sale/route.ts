import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'POS create sale endpoint - implementation in progress' },
    { status: 501 }
  );
}
