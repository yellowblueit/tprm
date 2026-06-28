import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';
import type { ReviewCycle } from '@prisma/client';

export class ReviewCycleService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List review cycles for a vendor, ordered by cycleNumber descending.
   */
  async listByVendor(
    vendorId: string,
    tenantId: string
  ): Promise<ReviewCycle[]> {
    return this.prisma.reviewCycle.findMany({
      where: { vendorId, tenantId },
      orderBy: { cycleNumber: 'desc' },
    });
  }

  /**
   * Create a new review cycle for a vendor.
   * Auto-calculates cycleNumber as max existing + 1.
   */
  async create(
    vendorId: string,
    tenantId: string,
    userId: string,
    data: {
      startDate: string;
      dueDate: string;
    }
  ): Promise<ReviewCycle> {
    // Find the max cycleNumber for this vendor
    const lastCycle = await this.prisma.reviewCycle.findFirst({
      where: { vendorId, tenantId },
      orderBy: { cycleNumber: 'desc' },
      select: { cycleNumber: true },
    });

    const nextCycleNumber = (lastCycle?.cycleNumber ?? 0) + 1;

    return this.prisma.reviewCycle.create({
      data: {
        tenantId,
        vendorId,
        cycleNumber: nextCycleNumber,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        triggeredBy: userId,
      },
    });
  }

  /**
   * Update a review cycle. If status changes to COMPLETED, set completedDate if not provided.
   */
  async update(
    id: string,
    tenantId: string,
    data: {
      status?: string;
      notes?: string;
      completedDate?: string;
    }
  ): Promise<ReviewCycle> {
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundError('ReviewCycle', id);

    // If status is changing to COMPLETED and no completedDate provided, set it now
    const isCompletingNow =
      data.status === 'COMPLETED' && cycle.status !== 'COMPLETED';
    const shouldSetCompletedDate = isCompletingNow && !data.completedDate;

    return this.prisma.reviewCycle.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status as never } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.completedDate
          ? { completedDate: new Date(data.completedDate) }
          : shouldSetCompletedDate
            ? { completedDate: new Date() }
            : {}),
      },
    });
  }
}
