import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import type { Remediation, RemediationComment } from '@prisma/client';

export interface RemediationListFilters {
  status?: string;
  priority?: string;
  vendorId?: string;
}

export class RemediationService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List remediations for a tenant with pagination and optional filters.
   */
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: RemediationListFilters
  ): Promise<PaginatedResult<Remediation>> {
    const where: Record<string, unknown> = {
      tenantId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.priority ? { priority: filters.priority } : {}),
      ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
    };

    const [remediations, total] = await Promise.all([
      this.prisma.remediation.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.remediation.count({ where }),
    ]);

    return {
      data: remediations,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  /**
   * List remediations for a specific vendor with pagination.
   */
  async listByVendor(
    vendorId: string,
    tenantId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Remediation>> {
    const where = { vendorId, tenantId };

    const [remediations, total] = await Promise.all([
      this.prisma.remediation.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.remediation.count({ where }),
    ]);

    return {
      data: remediations,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  /**
   * Create a new remediation for a vendor.
   */
  async create(
    vendorId: string,
    tenantId: string,
    userId: string,
    data: {
      title: string;
      description: string;
      domainId?: string;
      priority: string;
      dueDate?: string;
    }
  ): Promise<Remediation> {
    return this.prisma.remediation.create({
      data: {
        tenantId,
        vendorId,
        title: data.title,
        description: data.description,
        domainId: data.domainId,
        priority: data.priority as never,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdById: userId,
      },
    });
  }

  /**
   * Update a remediation. If status changes to CLOSED or ACCEPTED, set completedAt.
   */
  async update(
    id: string,
    tenantId: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      dueDate?: string | null;
    }
  ): Promise<Remediation> {
    const remediation = await this.prisma.remediation.findFirst({
      where: { id, tenantId },
    });
    if (!remediation) throw new NotFoundError('Remediation', id);

    // Determine if we need to set completedAt
    const completedStatuses = ['CLOSED', 'ACCEPTED'];
    const isCompletingNow =
      data.status &&
      completedStatuses.includes(data.status) &&
      !completedStatuses.includes(remediation.status);

    return this.prisma.remediation.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.priority !== undefined ? { priority: data.priority as never } : {}),
        ...(data.status !== undefined ? { status: data.status as never } : {}),
        ...(data.dueDate !== undefined
          ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
          : {}),
        ...(isCompletingNow ? { completedAt: new Date() } : {}),
      },
    });
  }

  /**
   * List comments for a remediation, ordered by createdAt ascending.
   */
  async listComments(
    remediationId: string,
    tenantId: string
  ): Promise<RemediationComment[]> {
    // Verify the remediation belongs to this tenant
    const remediation = await this.prisma.remediation.findFirst({
      where: { id: remediationId, tenantId },
    });
    if (!remediation) throw new NotFoundError('Remediation', remediationId);

    return this.prisma.remediationComment.findMany({
      where: { remediationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add a comment to a remediation with authorType INTERNAL_USER.
   */
  async addComment(
    remediationId: string,
    tenantId: string,
    userId: string,
    content: string
  ): Promise<RemediationComment> {
    // Verify the remediation belongs to this tenant
    const remediation = await this.prisma.remediation.findFirst({
      where: { id: remediationId, tenantId },
    });
    if (!remediation) throw new NotFoundError('Remediation', remediationId);

    return this.prisma.remediationComment.create({
      data: {
        remediationId,
        authorId: userId,
        authorType: 'INTERNAL_USER' as never,
        content,
      },
    });
  }
}
