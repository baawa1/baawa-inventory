import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Simple health check optimized for frequent monitoring
export async function GET() {
  try {
    // Simple connection test - just check if we can query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      { status: 503 }
    );
  }
  // Note: No finally block needed - using singleton prisma client
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
