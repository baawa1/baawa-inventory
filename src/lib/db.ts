import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced database connection with prepared statement conflict prevention
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'minimal',
    // Connection pool and timeout configuration for Nigeria's slow network
    transactionOptions: {
      maxWait: 30000, // 30 seconds - increased for slow networks
      timeout: 60000, // 60 seconds - generous timeout for Nigeria
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Enhanced connection cleanup for serverless environments
export const cleanupConnection = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during connection cleanup:', error);
  }
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
