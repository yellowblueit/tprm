import type { FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { getPrisma } from '../services/prisma.service.js';
import { getLogger } from '../utils/logger.js';

/**
 * Create an audit log entry for write operations.
 */
export async function createAuditLog(
  request: FastifyRequest,
  action: string,
  entityType: string,
  entityId?: string,
  changes?: Prisma.InputJsonValue
): Promise<void> {
  const logger = getLogger();

  if (!request.tenantContext) return;

  try {
    const prisma = getPrisma();
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenantContext.effectiveTenantId,
        userId: request.tenantContext.userId,
        action,
        entityType,
        entityId,
        changes: changes ?? Prisma.JsonNull,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      },
    });
  } catch (err) {
    // Audit log failures should not break the request
    logger.error({ err, action, entityType, entityId }, 'Failed to create audit log');
  }
}
