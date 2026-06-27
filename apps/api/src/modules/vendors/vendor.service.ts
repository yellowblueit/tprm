import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import type { Vendor, VendorOwner } from '@prisma/client';

export interface VendorListFilters {
  stage?: string;
  criticality?: string;
  riskLevel?: string;
}

export class VendorService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List vendors for a tenant with pagination, search, and filters.
   */
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    search?: string,
    filters?: VendorListFilters
  ): Promise<PaginatedResult<Vendor>> {
    const where: Record<string, unknown> = {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(filters?.stage ? { stage: filters.stage } : {}),
      ...(filters?.criticality ? { criticality: filters.criticality } : {}),
      ...(filters?.riskLevel
        ? {
            riskScores: {
              some: {
                isLatest: true,
                inherentRiskLevel: filters.riskLevel,
              },
            },
          }
        : {}),
    };

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              artifacts: true,
              remediations: true,
            },
          },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  /**
   * Get a single vendor by ID with all related data.
   */
  async getById(id: string, tenantId: string): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
      include: {
        owners: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        businessCases: true,
        dataClassifications: {
          include: {
            dataType: true,
          },
        },
        riskScores: {
          where: { isLatest: true },
          take: 1,
        },
      },
    });

    if (!vendor) throw new NotFoundError('Vendor', id);
    return vendor;
  }

  /**
   * Create a new vendor with business cases and data classifications in a transaction.
   */
  async create(
    tenantId: string,
    data: {
      name: string;
      website?: string;
      description?: string;
      industry?: string;
      headquartersCountry?: string;
      employeeCount?: string;
      yearFounded?: number;
      criticality: string;
      businessCases: string[];
      dataClassificationIds: string[];
      reviewFrequencyMonths: number;
    }
  ): Promise<Vendor> {
    // Check for unique name within the tenant
    const existing = await this.prisma.vendor.findFirst({
      where: { tenantId, name: data.name },
    });
    if (existing) {
      throw new ConflictError(`Vendor with name "${data.name}" already exists in this tenant`);
    }

    // Calculate the next review date based on reviewFrequencyMonths from now
    const nextReviewDate = new Date();
    nextReviewDate.setMonth(nextReviewDate.getMonth() + data.reviewFrequencyMonths);

    return this.prisma.$transaction(async (tx) => {
      // Create the vendor
      const vendor = await tx.vendor.create({
        data: {
          tenantId,
          name: data.name,
          website: data.website,
          description: data.description,
          industry: data.industry,
          headquartersCountry: data.headquartersCountry,
          employeeCount: data.employeeCount ? String(data.employeeCount) : undefined,
          yearFounded: data.yearFounded,
          criticality: data.criticality as never,
          reviewFrequencyMonths: data.reviewFrequencyMonths,
          nextReviewDate,
        },
      });

      // Create business case records
      if (data.businessCases.length > 0) {
        await tx.vendorBusinessCase.createMany({
          data: data.businessCases.map((businessCase) => ({
            vendorId: vendor.id,
            businessCase: businessCase as never,
          })),
        });
      }

      // Create data classification records
      if (data.dataClassificationIds.length > 0) {
        await tx.vendorDataClassification.createMany({
          data: data.dataClassificationIds.map((dataTypeId) => ({
            vendorId: vendor.id,
            dataTypeId,
          })),
        });
      }

      return vendor;
    });
  }

  /**
   * Update basic vendor fields.
   */
  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      website?: string;
      description?: string;
      industry?: string;
      headquartersCountry?: string;
      employeeCount?: string;
      yearFounded?: number;
      criticality?: string;
      reviewFrequencyMonths?: number;
    }
  ): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', id);

    // If name is changing, check for uniqueness within the tenant
    if (data.name && data.name !== vendor.name) {
      const existing = await this.prisma.vendor.findFirst({
        where: { tenantId, name: data.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError(`Vendor with name "${data.name}" already exists in this tenant`);
      }
    }

    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...data,
        criticality: data.criticality as never,
      },
    });
  }

  /**
   * Update the stage of a vendor.
   */
  async updateStage(id: string, tenantId: string, stage: string): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', id);

    return this.prisma.vendor.update({
      where: { id },
      data: { stage: stage as never },
    });
  }

  /**
   * Soft-delete a vendor by setting its stage to OFFBOARDED.
   */
  async softDelete(id: string, tenantId: string): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', id);

    return this.prisma.vendor.update({
      where: { id },
      data: { stage: 'OFFBOARDED' as never },
    });
  }

  /**
   * Replace all business cases for a vendor.
   */
  async setBusinessCases(
    vendorId: string,
    tenantId: string,
    businessCases: string[]
  ): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    await this.prisma.$transaction(async (tx) => {
      // Delete existing business cases
      await tx.vendorBusinessCase.deleteMany({
        where: { vendorId },
      });

      // Create new business cases
      if (businessCases.length > 0) {
        await tx.vendorBusinessCase.createMany({
          data: businessCases.map((businessCase) => ({
            vendorId,
            businessCase: businessCase as never,
          })),
        });
      }
    });
  }

  /**
   * Replace all data classifications for a vendor.
   */
  async setDataClassifications(
    vendorId: string,
    tenantId: string,
    dataTypeIds: string[]
  ): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    await this.prisma.$transaction(async (tx) => {
      // Delete existing data classifications
      await tx.vendorDataClassification.deleteMany({
        where: { vendorId },
      });

      // Create new data classifications
      if (dataTypeIds.length > 0) {
        await tx.vendorDataClassification.createMany({
          data: dataTypeIds.map((dataTypeId) => ({
            vendorId,
            dataTypeId,
          })),
        });
      }
    });
  }

  /**
   * Get all owners of a vendor with user details.
   */
  async getOwners(vendorId: string, tenantId: string): Promise<VendorOwner[]> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    return this.prisma.vendorOwner.findMany({
      where: { vendorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
    });
  }

  /**
   * Add an owner to a vendor. If isPrimary, demote other primary owners.
   */
  async addOwner(
    vendorId: string,
    tenantId: string,
    userId: string,
    isPrimary: boolean
  ): Promise<VendorOwner> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    // Check if this user is already an owner
    const existing = await this.prisma.vendorOwner.findUnique({
      where: { vendorId_userId: { vendorId, userId } },
    });
    if (existing) {
      throw new ConflictError('User is already an owner of this vendor');
    }

    return this.prisma.$transaction(async (tx) => {
      // If setting as primary, demote all other owners
      if (isPrimary) {
        await tx.vendorOwner.updateMany({
          where: { vendorId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.vendorOwner.create({
        data: {
          vendorId,
          userId,
          isPrimary,
        },
      });
    });
  }

  /**
   * Remove an owner from a vendor.
   */
  async removeOwner(vendorId: string, tenantId: string, userId: string): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    const ownership = await this.prisma.vendorOwner.findUnique({
      where: { vendorId_userId: { vendorId, userId } },
    });
    if (!ownership) throw new NotFoundError('VendorOwner', userId);

    await this.prisma.vendorOwner.delete({
      where: { id: ownership.id },
    });
  }
}
