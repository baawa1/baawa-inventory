import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pool settings for better performance
    // errorFormat: 'minimal',
    // Connection pool configuration for better performance
    // These will help with concurrent requests
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
