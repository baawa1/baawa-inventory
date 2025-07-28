import { NextResponse } from 'next/server';
import { XprinterXP58Service } from '@/lib/pos/thermal-printer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ip, port } = body;

    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Test network printer connection
    const isConnected = await XprinterXP58Service.testNetworkPrinter(
      ip,
      port || 9100
    );

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Network printer connection successful',
        ip,
        port: port || 9100,
      });
    } else {
      return NextResponse.json(
        { error: 'Network printer connection failed' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Network printer test failed:', error);
    return NextResponse.json(
      { error: 'Network printer test failed' },
      { status: 500 }
    );
  }
}
