import { NextResponse } from 'next/server';
import { prisma, cleanupConnection } from '@/lib/db';

export async function GET() {
  try {
    // Clear any potential prepared statement conflicts
    if (process.env.NODE_ENV === 'production') {
      try {
        await cleanupConnection();
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError);
      }
    }

    // Test database connection with a simple query that doesn't use prepared statements
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;

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

    // Attempt cleanup on error
    try {
      await cleanupConnection();
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
