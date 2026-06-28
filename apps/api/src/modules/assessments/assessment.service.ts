import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';

const MATURITY_LEVEL_SCORES: Record<string, number> = {
  NOT_ASSESSED: 0,
  INITIAL: 1,
  DEVELOPING: 2,
  DEFINED: 3,
  MANAGED: 4,
  OPTIMIZING: 5,
};

export class AssessmentService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List domain assessments for a vendor, including security domain info.
   */
  async listByVendor(vendorId: string, tenantId: string) {
    // Verify vendor belongs to tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    return this.prisma.domainAssessment.findMany({
      where: { vendorId },
      include: {
        domain: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Upsert a domain assessment for a vendor.
   */
  async upsert(
    vendorId: string,
    tenantId: string,
    data: {
      domainId: string;
      maturityLevel: string;
      controlEffectiveness?: number;
      gapDescription?: string;
      findings?: string;
    }
  ) {
    // Verify vendor belongs to tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    return this.prisma.domainAssessment.upsert({
      where: {
        vendorId_domainId: {
          vendorId,
          domainId: data.domainId,
        },
      },
      create: {
        vendorId,
        tenantId,
        domainId: data.domainId,
        maturityLevel: data.maturityLevel as never,
        controlEffectiveness: data.controlEffectiveness,
        gapDescription: data.gapDescription,
        findings: data.findings,
      },
      update: {
        maturityLevel: data.maturityLevel as never,
        controlEffectiveness: data.controlEffectiveness,
        gapDescription: data.gapDescription,
        findings: data.findings,
      },
      include: {
        domain: true,
      },
    });
  }

  /**
   * Get aggregate assessment stats across all vendors in a tenant.
   */
  async getSummary(tenantId: string) {
    const assessments = await this.prisma.domainAssessment.findMany({
      where: { vendor: { tenantId } },
      select: {
        maturityLevel: true,
        controlEffectiveness: true,
      },
    });

    const totalAssessments = assessments.length;

    // Calculate average maturity from maturity levels
    let averageMaturity = 0;
    if (totalAssessments > 0) {
      const totalScore = assessments.reduce((sum, a) => {
        return sum + (MATURITY_LEVEL_SCORES[a.maturityLevel] ?? 0);
      }, 0);
      averageMaturity =
        Math.round((totalScore / totalAssessments) * 100) / 100;
    }

    // Count by maturity level
    const byMaturityLevel: Record<string, number> = {};
    for (const a of assessments) {
      byMaturityLevel[a.maturityLevel] =
        (byMaturityLevel[a.maturityLevel] ?? 0) + 1;
    }

    return {
      totalAssessments,
      averageMaturity,
      byMaturityLevel,
    };
  }
}
