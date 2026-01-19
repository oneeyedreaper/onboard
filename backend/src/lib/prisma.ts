import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ['error', 'warn'],  // Only log errors and warnings, not queries
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
