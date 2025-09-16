import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
    // Connection pool and timeout configuration for Nigeria's slow network
    transactionOptions: {
      maxWait: 30000, // 30 seconds - increased for slow networks
      timeout: 60000, // 60 seconds - generous timeout for Nigeria
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
