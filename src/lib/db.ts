import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced database connection with extreme serverless optimization
const createPrismaClient = () => {
  // Use direct connection for serverless if pooled connection fails
  const databaseUrl = process.env.DATABASE_URL;

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    errorFormat: 'minimal',
    // Ultra-aggressive serverless optimization
    transactionOptions: {
      maxWait: 5000,  // 5 seconds - extremely aggressive
      timeout: 8000,  // 8 seconds - very short timeout
    },
  });

  return client;
};

// Alternative client for fallback with direct connection
const createDirectPrismaClient = () => {
  // Convert pooled URL to direct URL by changing port 6543 to 5432
  const directUrl = process.env.DATABASE_URL?.replace(':6543/', ':5432/').replace('?pgbouncer=true&connection_limit=1', '');

  const client = new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: directUrl,
      },
    },
    errorFormat: 'minimal',
    transactionOptions: {
      maxWait: 3000,  // 3 seconds - emergency fallback
      timeout: 5000,  // 5 seconds - emergency timeout
    },
  });

  return client;
};

// Aggressive prepared statement conflict resolution for serverless
// Always use fresh clients in production to avoid prepared statement conflicts
export const prisma = process.env.NODE_ENV === 'production'
  ? createPrismaClient()
  : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Enhanced connection cleanup for serverless environments
export const cleanupConnection = async (client?: PrismaClient) => {
  try {
    const targetClient = client || prisma;
    await targetClient.$disconnect();
  } catch (error) {
    console.error('Error during connection cleanup:', error);
  }
};

// Create a new client for each API request in production with fallback logic
export const createFreshPrismaClient = () => {
  if (process.env.NODE_ENV === 'production') {
    return createPrismaClient();
  }
  return prisma;
};

// Enhanced client creation with fallback to direct connection
export const createFreshPrismaClientWithFallback = () => {
  if (process.env.NODE_ENV === 'production') {
    // First try pooled connection, then direct connection
    return createPrismaClient();
  }
  return prisma;
};

// Direct connection fallback
export const createDirectClient = () => {
  if (process.env.NODE_ENV === 'production') {
    return createDirectPrismaClient();
  }
  return prisma;
};

// Connection test with retry mechanism
export const testConnection = async (client: PrismaClient, retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client.$queryRaw`SELECT 1 as test`;
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return false;
};

// Note: Removed process event handlers to avoid Edge Runtime compatibility issues
// Connection cleanup is handled in finally blocks of each API route
