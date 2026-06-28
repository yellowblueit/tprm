import { getPrisma } from '../../services/prisma.service.js';

export class AnalyticsService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * Get high-level dashboard metrics for a tenant.
   */
  async getDashboardMetrics(tenantId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalVendors,
      vendorsByStageRaw,
      riskDistributionRaw,
      openRemediations,
      upcomingReviews,
      totalCompliance,
      compliantCount,
      recentAlerts,
    ] = await Promise.all([
      // Total vendors
      this.prisma.vendor.count({ where: { tenantId } }),

      // Vendors grouped by stage
      this.prisma.vendor.groupBy({
        by: ['stage'],
        where: { tenantId },
        _count: { id: true },
      }),

      // Risk distribution from latest risk scores
      this.prisma.riskScore.groupBy({
        by: ['inherentRiskLevel'],
        where: {
          isLatest: true,
          vendor: { tenantId },
        },
        _count: { id: true },
      }),

      // Open remediations (not CLOSED or ACCEPTED)
      this.prisma.remediation.count({
        where: {
          vendor: { tenantId },
          status: { notIn: ['CLOSED', 'ACCEPTED'] },
        },
      }),

      // Upcoming reviews within 30 days
      this.prisma.vendor.count({
        where: {
          tenantId,
          nextReviewDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),

      // Total compliance records
      this.prisma.vendorCompliance.count({
        where: { vendor: { tenantId } },
      }),

      // Compliant records
      this.prisma.vendorCompliance.count({
        where: {
          vendor: { tenantId },
          status: 'COMPLIANT',
        },
      }),

      // Recent alerts
      this.prisma.monitoringAlert.findMany({
        where: { vendor: { tenantId } },
        orderBy: { detectedAt: 'desc' },
        take: 5,
        include: {
          vendor: {
            select: { name: true },
          },
        },
      }),
    ]);

    const vendorsByStage: Record<string, number> = {};
    for (const row of vendorsByStageRaw) {
      vendorsByStage[row.stage] = row._count.id;
    }

    const riskDistribution: Record<string, number> = {};
    for (const row of riskDistributionRaw) {
      riskDistribution[row.inherentRiskLevel] = row._count.id;
    }

    const complianceCoverage =
      totalCompliance > 0
        ? Math.round((compliantCount / totalCompliance) * 10000) / 100
        : 0;

    return {
      totalVendors,
      vendorsByStage,
      riskDistribution,
      openRemediations,
      upcomingReviews,
      complianceCoverage,
      recentAlerts,
    };
  }

  /**
   * Get vendor count by inherent risk level from latest risk scores.
   */
  async getRiskDistribution(tenantId: string) {
    const rows = await this.prisma.riskScore.groupBy({
      by: ['inherentRiskLevel'],
      where: {
        isLatest: true,
        vendor: { tenantId },
      },
      _count: { id: true },
    });

    const distribution: Record<string, number> = {};
    for (const row of rows) {
      distribution[row.inherentRiskLevel] = row._count.id;
    }

    return distribution;
  }

  /**
   * Get monthly average inherent/residual risk scores over the past N months.
   */
  async getRiskTrend(tenantId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const scores = await this.prisma.riskScore.findMany({
      where: {
        vendor: { tenantId },
        calculatedAt: { gte: startDate },
      },
      select: {
        calculatedAt: true,
        inherentRiskScore: true,
        residualRiskScore: true,
      },
      orderBy: { calculatedAt: 'asc' },
    });

    // Group by year-month
    const monthlyMap = new Map<
      string,
      { inherentSum: number; residualSum: number; count: number }
    >();

    for (const score of scores) {
      const date = new Date(score.calculatedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { inherentSum: 0, residualSum: 0, count: 0 });
      }

      const entry = monthlyMap.get(key)!;
      entry.inherentSum += score.inherentRiskScore;
      entry.residualSum += score.residualRiskScore ?? 0;
      entry.count += 1;
    }

    const trend: { month: string; inherent: number; residual: number }[] = [];
    for (const [month, data] of monthlyMap) {
      trend.push({
        month,
        inherent: Math.round((data.inherentSum / data.count) * 100) / 100,
        residual: Math.round((data.residualSum / data.count) * 100) / 100,
      });
    }

    return trend;
  }

  /**
   * Get vendor count grouped by pipeline stage.
   */
  async getVendorPipeline(tenantId: string) {
    const rows = await this.prisma.vendor.groupBy({
      by: ['stage'],
      where: { tenantId },
      _count: { id: true },
    });

    const pipeline: Record<string, number> = {};
    for (const row of rows) {
      pipeline[row.stage] = row._count.id;
    }

    return pipeline;
  }

  /**
   * Get remediation count grouped by status.
   */
  async getRemediationStats(tenantId: string) {
    const rows = await this.prisma.remediation.groupBy({
      by: ['status'],
      where: { vendor: { tenantId } },
      _count: { id: true },
    });

    const stats: Record<string, number> = {};
    for (const row of rows) {
      stats[row.status] = row._count.id;
    }

    return stats;
  }
}
