import { prisma } from './db';

/**
 * Test database connection using Prisma
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await prisma.$connect();

    // Test basic query capability
    const _result = await prisma.$queryRaw`SELECT 1 as test`;

    return {
      success: true,
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get database schema information
 */
export async function getDatabaseInfo() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    return {
      success: true,
      tables,
      message: 'Schema information retrieved',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get schema info: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}
