import { Prisma } from '@prisma/client';
import type { Tenant } from '@prisma/client';
import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import { DEFAULT_SCORING_MATRIX } from '@tprm/shared';

export class TenantService {
  private get prisma() {
    return getPrisma();
  }

  async list(
    parentTenantId: string,
    page: number,
    pageSize: number,
    search?: string
  ): Promise<PaginatedResult<Tenant>> {
    const where = {
      parentTenantId,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { name: 'asc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async getById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError('Tenant', id);
    return tenant;
  }

  async create(data: {
    name: string;
    slug: string;
    parentTenantId: string;
  }): Promise<Tenant> {
    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictError(`Tenant with slug "${data.slug}" already exists`);
    }

    // Create tenant with default scoring matrix
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: 'CLIENT',
        parentTenantId: data.parentTenantId,
      },
    });

    // Create default scoring matrix for the new tenant
    await this.prisma.scoringMatrix.create({
      data: {
        tenantId: tenant.id,
        name: 'Default',
        isActive: true,
        config: DEFAULT_SCORING_MATRIX as unknown as Prisma.InputJsonValue,
      },
    });

    return tenant;
  }

  async update(
    id: string,
    data: { name?: string; isActive?: boolean; settings?: Record<string, unknown> }
  ): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError('Tenant', id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.settings !== undefined && {
          settings: data.settings as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async deactivate(id: string): Promise<Tenant> {
    return this.update(id, { isActive: false });
  }
}
