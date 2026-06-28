import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import type { MonitoringAlert } from '@prisma/client';

export interface AlertListFilters {
  severity?: string;
  type?: string;
  vendorId?: string;
  acknowledged?: string;
}

export class MonitoringService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List alerts for a tenant with pagination and optional filters.
   */
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: AlertListFilters
  ): Promise<PaginatedResult<MonitoringAlert>> {
    const where: Record<string, unknown> = {
      tenantId,
      ...(filters?.severity ? { severity: filters.severity } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
      ...(filters?.acknowledged !== undefined
        ? { acknowledged: filters.acknowledged === 'true' }
        : {}),
    };

    const [alerts, total] = await Promise.all([
      this.prisma.monitoringAlert.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { detectedAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.monitoringAlert.count({ where }),
    ]);

    return {
      data: alerts,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  /**
   * List alerts for a specific vendor, ordered by detectedAt descending.
   */
  async listByVendor(
    vendorId: string,
    tenantId: string
  ): Promise<MonitoringAlert[]> {
    return this.prisma.monitoringAlert.findMany({
      where: { vendorId, tenantId },
      orderBy: { detectedAt: 'desc' },
    });
  }

  /**
   * Create a new monitoring alert.
   */
  async create(
    tenantId: string,
    data: {
      vendorId: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      sourceUrl?: string;
      riskImpact?: number;
    }
  ): Promise<MonitoringAlert> {
    return this.prisma.monitoringAlert.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        type: data.type as never,
        severity: data.severity as never,
        title: data.title,
        description: data.description,
        sourceUrl: data.sourceUrl,
        riskImpact: data.riskImpact,
        detectedAt: new Date(),
      },
    });
  }

  /**
   * Update an alert (acknowledge or dismiss).
   * If acknowledging, set acknowledgedAt and acknowledgedById.
   */
  async update(
    id: string,
    tenantId: string,
    data: {
      acknowledged?: boolean;
      dismissed?: boolean;
    },
    userId: string
  ): Promise<MonitoringAlert> {
    const alert = await this.prisma.monitoringAlert.findFirst({
      where: { id, tenantId },
    });
    if (!alert) throw new NotFoundError('MonitoringAlert', id);

    return this.prisma.monitoringAlert.update({
      where: { id },
      data: {
        ...(data.acknowledged !== undefined
          ? {
              acknowledged: data.acknowledged,
              ...(data.acknowledged
                ? { acknowledgedAt: new Date(), acknowledgedById: userId }
                : {}),
            }
          : {}),
        ...(data.dismissed !== undefined ? { dismissed: data.dismissed } : {}),
      },
    });
  }
}
