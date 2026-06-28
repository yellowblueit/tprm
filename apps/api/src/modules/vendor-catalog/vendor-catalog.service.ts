import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import type { CatalogVendor, Vendor } from '@prisma/client';

export class VendorCatalogService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * Paginated list of catalog vendors with optional name search.
   * Includes a count of associated catalog artifacts.
   */
  async list(
    search?: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<CatalogVendor>> {
    const where: Record<string, unknown> = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : {};

    const [catalogVendors, total] = await Promise.all([
      this.prisma.catalogVendor.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              catalogArtifacts: true,
            },
          },
        },
      }),
      this.prisma.catalogVendor.count({ where }),
    ]);

    return {
      data: catalogVendors,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  /**
   * Create a new catalog vendor.
   */
  async create(data: {
    name: string;
    website?: string;
    description?: string;
    industry?: string;
  }): Promise<CatalogVendor> {
    return this.prisma.catalogVendor.create({
      data: {
        name: data.name,
        website: data.website,
        description: data.description,
        industry: data.industry,
      },
    });
  }

  /**
   * Assign a catalog vendor to a tenant by creating a Vendor record from catalog data.
   * Copies name, website, description, industry from the CatalogVendor.
   * Throws ConflictError if a vendor with the same name already exists in the tenant.
   */
  async assignToTenant(
    catalogVendorId: string,
    tenantId: string,
    criticality: string
  ): Promise<Vendor> {
    const catalogVendor = await this.prisma.catalogVendor.findUnique({
      where: { id: catalogVendorId },
    });
    if (!catalogVendor) {
      throw new NotFoundError('CatalogVendor', catalogVendorId);
    }

    // Check for existing vendor with the same name in the tenant
    const existing = await this.prisma.vendor.findFirst({
      where: { tenantId, name: catalogVendor.name },
    });
    if (existing) {
      throw new ConflictError(
        `Vendor with name "${catalogVendor.name}" already exists in this tenant`
      );
    }

    return this.prisma.vendor.create({
      data: {
        tenantId,
        name: catalogVendor.name,
        website: catalogVendor.website,
        description: catalogVendor.description,
        industry: catalogVendor.industry,
        criticality: criticality as never,
        catalogVendorId: catalogVendor.id,
      },
    });
  }
}
