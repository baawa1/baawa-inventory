import { NextResponse } from 'next/server';
import { createFreshPrismaClient, createDirectClient } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();

  // Try pooled connection first, then direct connection
  let prisma = createFreshPrismaClient();
  let connectionType = 'pooled';
  let attempts = [];

  try {
    // Enhanced connection test with timeout
    const connectionTest = await Promise.race([
      prisma.$queryRaw`SELECT 1 as health_check,
        current_database() as database_name,
        current_user as user_name,
        version() as pg_version`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
      )
    ]);

    const responseTime = Date.now() - startTime;
    attempts.push({ type: connectionType, success: true, responseTime });

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        connectionType,
        responseTime: `${responseTime}ms`,
        connectionTest: connectionTest,
        attempts,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ?
          process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') :
          'NOT_SET'
      },
      { status: 200 }
    );
  } catch (pooledError) {
    const pooledResponseTime = Date.now() - startTime;
    attempts.push({
      type: 'pooled',
      success: false,
      responseTime: pooledResponseTime,
      error: pooledError instanceof Error ? pooledError.message : 'Unknown error'
    });

    // Cleanup failed pooled connection
    try {
      await prisma.$disconnect();
    } catch (cleanupError) {
      console.error('Error cleaning up pooled connection:', cleanupError);
    }

    // Try direct connection as fallback
    try {
      prisma = createDirectClient();
      connectionType = 'direct';
      const directStartTime = Date.now();

      const connectionTest = await Promise.race([
        prisma.$queryRaw`SELECT 1 as health_check,
          current_database() as database_name,
          current_user as user_name,
          'DIRECT_CONNECTION' as connection_mode`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Direct connection timeout after 5 seconds')), 5000)
        )
      ]);

      const directResponseTime = Date.now() - directStartTime;
      const totalResponseTime = Date.now() - startTime;
      attempts.push({ type: 'direct', success: true, responseTime: directResponseTime });

      return NextResponse.json(
        {
          status: 'healthy',
          database: 'connected',
          connectionType: 'direct_fallback',
          responseTime: `${totalResponseTime}ms`,
          connectionTest: connectionTest,
          attempts,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
          note: 'Pooled connection failed, using direct connection'
        },
        { status: 200 }
      );
    } catch (directError) {
      const directResponseTime = Date.now() - startTime;
      attempts.push({
        type: 'direct',
        success: false,
        responseTime: directResponseTime,
        error: directError instanceof Error ? directError.message : 'Unknown error'
      });

      console.error('Both pooled and direct connections failed:', { pooledError, directError });

      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          error: 'Both pooled and direct connections failed',
          pooledError: pooledError instanceof Error ? pooledError.message : 'Unknown pooled error',
          directError: directError instanceof Error ? directError.message : 'Unknown direct error',
          attempts,
          responseTime: `${directResponseTime}ms`,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ?
            process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') :
            'NOT_SET'
        },
        { status: 503 }
      );
    }
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
