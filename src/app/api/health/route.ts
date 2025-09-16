import { NextResponse } from 'next/server';
import { createFreshPrismaClient, testConnection } from '@/lib/db';

export async function GET() {
  const prisma = createFreshPrismaClient();

  try {
    // Test database connection with retry mechanism
    const isConnected = await testConnection(prisma, 2); // Only 2 retries for health check

    if (isConnected) {
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
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          error: 'Database connection failed after retries',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
        },
        { status: 503 }
      );
    }
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
      { status: 500 }
    );
  } finally {
    // Always cleanup the connection in production
    if (process.env.NODE_ENV === 'production') {
      try {
        await prisma.$disconnect();
      } catch (cleanupError) {
        console.error('Error during health check cleanup:', cleanupError);
      }
    }
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
