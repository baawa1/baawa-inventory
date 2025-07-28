import { NextResponse } from 'next/server';
import { XprinterXP58Service } from '@/lib/pos/thermal-printer';

export async function GET() {
  try {
    // Get available USB devices
    const devices = XprinterXP58Service.getAvailableUSBDevices();

    return NextResponse.json(devices);
  } catch (error) {
    console.error('Failed to get USB devices:', error);
    return NextResponse.json(
      { error: 'Failed to get USB devices' },
      { status: 500 }
    );
  }
}
