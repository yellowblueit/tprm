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
   * Returns array of {level, count, percentage} matching frontend RiskDistribution type.
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

    const total = rows.reduce((sum, r) => sum + r._count.id, 0);

    return rows.map((row) => ({
      level: row.inherentRiskLevel,
      count: row._count.id,
      percentage: total > 0 ? Math.round((row._count.id / total) * 100) : 0,
    }));
  }

  /**
   * Get monthly average risk scores over the past N months.
   * Returns array of {month, averageScore, highRiskCount} matching frontend RiskTrendPoint type.
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
        inherentRiskLevel: true,
      },
      orderBy: { calculatedAt: 'asc' },
    });

    const monthlyMap = new Map<
      string,
      { scoreSum: number; count: number; highRiskCount: number }
    >();

    for (const score of scores) {
      const date = new Date(score.calculatedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { scoreSum: 0, count: 0, highRiskCount: 0 });
      }

      const entry = monthlyMap.get(key)!;
      entry.scoreSum += score.inherentRiskScore;
      entry.count += 1;
      if (score.inherentRiskLevel === 'HIGH' || score.inherentRiskLevel === 'CRITICAL') {
        entry.highRiskCount += 1;
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      averageScore: Math.round((data.scoreSum / data.count) * 100) / 100,
      highRiskCount: data.highRiskCount,
    }));
  }

  /**
   * Get vendor count grouped by pipeline stage.
   * Returns array of {stage, count} matching frontend VendorPipelineStage type.
   */
  async getVendorPipeline(tenantId: string) {
    const rows = await this.prisma.vendor.groupBy({
      by: ['stage'],
      where: { tenantId },
      _count: { id: true },
    });

    return rows.map((row) => ({
      stage: row.stage,
      count: row._count.id,
    }));
  }

  /**
   * Get remediation stats as typed totals matching frontend RemediationStats type.
   */
  async getRemediationStats(tenantId: string) {
    const rows = await this.prisma.remediation.groupBy({
      by: ['status'],
      where: { vendor: { tenantId } },
      _count: { id: true },
    });

    const byStatus: Record<string, number> = {};
    for (const row of rows) {
      byStatus[row.status] = row._count.id;
    }

    const open =
      (byStatus['OPEN'] ?? 0) +
      (byStatus['AWAITING_VENDOR'] ?? 0) +
      (byStatus['VENDOR_RESPONDED'] ?? 0) +
      (byStatus['UNDER_REVIEW'] ?? 0);

    const inProgress = byStatus['IN_PROGRESS'] ?? 0;
    const completed = (byStatus['ACCEPTED'] ?? 0) + (byStatus['CLOSED'] ?? 0);
    const overdue = byStatus['OVERDUE'] ?? 0;
    const total = Object.values(byStatus).reduce((s, v) => s + v, 0);

    return { total, open, inProgress, completed, overdue, averageResolutionDays: 0 };
  }
}
