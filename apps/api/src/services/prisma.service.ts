import { PrismaClient } from '@prisma/client';
import { getEnv } from '../config/env.js';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const env = getEnv();
    prisma = new PrismaClient({
      datasourceUrl: env.DATABASE_URL,
      log:
        env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }
  return prisma;
}

/**
 * Execute a database operation within a tenant context.
 * Sets PostgreSQL session variables for Row-Level Security.
 */
export async function withTenantContext<T>(
  tenantId: string,
  isMspUser: boolean,
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const db = getPrisma();

  return db.$transaction(async (tx) => {
    // Set RLS context variables
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
    await tx.$executeRawUnsafe(
      `SET LOCAL app.is_msp_user = '${isMspUser}'`
    );
    return operation(tx as unknown as PrismaClient);
  });
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
