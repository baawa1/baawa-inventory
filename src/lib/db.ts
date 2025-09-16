import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced database connection with serverless optimization
const createPrismaClient = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'minimal',
    // Aggressive serverless optimization
    transactionOptions: {
      maxWait: 10000, // 10 seconds - very aggressive for serverless
      timeout: 15000, // 15 seconds - short timeout for quick failures
    },
  });

  // Add connection error handling
  client.$on('error', (error) => {
    console.error('Prisma client error:', error);
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

// Create a new client for each API request in production with retry logic
export const createFreshPrismaClient = () => {
  if (process.env.NODE_ENV === 'production') {
    return createPrismaClient();
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

// Graceful shutdown for connection cleanup (only in Node.js runtime)
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
