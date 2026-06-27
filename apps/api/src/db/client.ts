import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client for the API process.
 *
 * POPIA: keep query logging off in non-development environments so personal
 * data never lands in logs. Sensitive values must never be logged regardless.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
