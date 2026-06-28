import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';
import type { Subprocessor, VendorSubprocessor } from '@prisma/client';

export class SubprocessorService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List all global subprocessor records, ordered by name.
   */
  async listAll(): Promise<Subprocessor[]> {
    return this.prisma.subprocessor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * List vendor-subprocessor links for a specific vendor, including subprocessor details.
   */
  async listByVendor(vendorId: string, tenantId: string): Promise<VendorSubprocessor[]> {
    return this.prisma.vendorSubprocessor.findMany({
      where: { vendorId, tenantId },
      include: {
        subprocessor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Link a subprocessor to a vendor.
   */
  async link(
    vendorId: string,
    tenantId: string,
    data: {
      subprocessorId: string;
      serviceProvided?: string;
      dataShared?: string;
      riskLevel?: string;
    }
  ): Promise<VendorSubprocessor> {
    // Verify the subprocessor exists
    const subprocessor = await this.prisma.subprocessor.findUnique({
      where: { id: data.subprocessorId },
    });
    if (!subprocessor) {
      throw new NotFoundError('Subprocessor', data.subprocessorId);
    }

    return this.prisma.vendorSubprocessor.create({
      data: {
        tenantId,
        vendorId,
        subprocessorId: data.subprocessorId,
        serviceProvided: data.serviceProvided,
        dataShared: data.dataShared,
        riskLevel: data.riskLevel as never,
        aiDiscovered: false,
      },
      include: {
        subprocessor: true,
      },
    });
  }

  /**
   * Unlink a subprocessor from a vendor.
   */
  async unlink(vendorId: string, tenantId: string, subprocessorId: string): Promise<void> {
    const link = await this.prisma.vendorSubprocessor.findFirst({
      where: { vendorId, subprocessorId, tenantId },
    });

    if (!link) {
      throw new NotFoundError('VendorSubprocessor', subprocessorId);
    }

    await this.prisma.vendorSubprocessor.delete({
      where: { id: link.id },
    });
  }
}
