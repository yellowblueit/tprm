import { getPrisma } from '../../services/prisma.service.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import type { AuditLog } from '@prisma/client';

export class ActivityService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List audit log entries for a specific vendor, ordered by most recent first.
   */
  async listByVendor(
    vendorId: string,
    tenantId: string,
    limit = 50
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityId: vendorId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Paginated list of all audit log entries for a tenant, ordered by most recent first.
   */
  async listByTenant(
    tenantId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<AuditLog>> {
    const where = { tenantId };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              displayName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }
}
