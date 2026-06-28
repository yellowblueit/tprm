import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
}

function criticalityToImpactScore(criticality: string): number {
  switch (criticality) {
    case 'CRITICAL':
      return 1.0;
    case 'HIGH':
      return 0.75;
    case 'MEDIUM':
      return 0.5;
    case 'LOW':
      return 0.25;
    default:
      return 0.5;
  }
}

export class RiskScoringService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List all risk scores for a vendor, most recent first.
   */
  async listByVendor(vendorId: string, tenantId: string) {
    // Verify vendor belongs to tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    return this.prisma.riskScore.findMany({
      where: { vendorId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  /**
   * Get the latest risk score for a vendor.
   */
  async getLatest(vendorId: string, tenantId: string) {
    // Verify vendor belongs to tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    const score = await this.prisma.riskScore.findFirst({
      where: { vendorId, isLatest: true },
    });

    if (!score) {
      throw new NotFoundError('RiskScore', vendorId);
    }

    return score;
  }

  /**
   * Calculate and create a new risk score for a vendor.
   */
  async calculate(vendorId: string, tenantId: string, userId: string) {
    // Get the vendor with domain assessments
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
      include: {
        domainAssessments: true,
      },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    return this.prisma.$transaction(async (tx) => {
      // Mark all existing scores as not latest
      await tx.riskScore.updateMany({
        where: { vendorId },
        data: { isLatest: false },
      });

      // Calculate inherent risk score from domain assessments
      let inherentRiskScore: number;
      if (vendor.domainAssessments.length > 0) {
        const effectivenessValues = vendor.domainAssessments
          .map((da) => da.controlEffectiveness)
          .filter((v): v is number => v !== null);

        inherentRiskScore =
          effectivenessValues.length > 0
            ? effectivenessValues.reduce((sum, val) => sum + val, 0) /
              effectivenessValues.length
            : 50;
      } else {
        inherentRiskScore = 50;
      }

      const inherentRiskLevel = scoreToRiskLevel(inherentRiskScore);

      // Simplified residual calculation
      const residualRiskScore = inherentRiskScore * 0.6;
      const residualRiskLevel = scoreToRiskLevel(residualRiskScore);

      // Impact score based on vendor criticality
      const impactScore = criticalityToImpactScore(vendor.criticality);

      // Create the new risk score
      const riskScore = await tx.riskScore.create({
        data: {
          tenantId,
          vendorId,
          inherentRiskScore,
          inherentRiskLevel: inherentRiskLevel as never,
          inherentBreakdown: { score: inherentRiskScore, level: inherentRiskLevel },
          residualRiskScore,
          residualRiskLevel: residualRiskLevel as never,
          residualBreakdown: { score: residualRiskScore, level: residualRiskLevel },
          impactScore,
          isLatest: true,
          calculatedById: userId,
          calculatedAt: new Date(),
        },
      });

      return riskScore;
    });
  }
}
