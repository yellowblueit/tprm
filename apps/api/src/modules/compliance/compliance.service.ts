import { getPrisma } from '../../services/prisma.service.js';
import type { ComplianceFramework, VendorCompliance } from '@prisma/client';

export class ComplianceService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List all active compliance frameworks, ordered by name.
   */
  async listFrameworks(): Promise<ComplianceFramework[]> {
    return this.prisma.complianceFramework.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all compliance records for a vendor, including framework details.
   */
  async getVendorCompliance(
    vendorId: string,
    tenantId: string
  ): Promise<VendorCompliance[]> {
    return this.prisma.vendorCompliance.findMany({
      where: { vendorId, tenantId },
      include: {
        framework: true,
      },
    });
  }

  /**
   * Upsert a vendor compliance record by vendorId + frameworkId unique constraint.
   */
  async upsertCompliance(
    vendorId: string,
    tenantId: string,
    data: {
      frameworkId: string;
      status: string;
      certificationDate?: string;
      expirationDate?: string;
      notes?: string;
    }
  ): Promise<VendorCompliance> {
    return this.prisma.vendorCompliance.upsert({
      where: {
        vendorId_frameworkId: {
          vendorId,
          frameworkId: data.frameworkId,
        },
      },
      create: {
        tenantId,
        vendorId,
        frameworkId: data.frameworkId,
        status: data.status as never,
        certificationDate: data.certificationDate
          ? new Date(data.certificationDate)
          : undefined,
        expirationDate: data.expirationDate
          ? new Date(data.expirationDate)
          : undefined,
        notes: data.notes,
      },
      update: {
        status: data.status as never,
        certificationDate: data.certificationDate
          ? new Date(data.certificationDate)
          : undefined,
        expirationDate: data.expirationDate
          ? new Date(data.expirationDate)
          : undefined,
        notes: data.notes,
      },
    });
  }

  /**
   * Get the compliance matrix: all vendors with their compliance statuses per framework.
   */
  async getMatrix(tenantId: string): Promise<
    {
      vendor: { id: string; name: string };
      frameworks: {
        frameworkId: string;
        frameworkCode: string;
        frameworkName: string;
        status: string;
      }[];
    }[]
  > {
    // Get all vendors with their compliance records
    const vendors = await this.prisma.vendor.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        complianceRecords: {
          include: {
            framework: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return vendors.map((vendor) => ({
      vendor: { id: vendor.id, name: vendor.name },
      frameworks: vendor.complianceRecords.map((vc: any) => ({
        frameworkId: vc.framework.id,
        frameworkCode: vc.framework.code,
        frameworkName: vc.framework.name,
        status: vc.status,
      })),
    }));
  }
}
