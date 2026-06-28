import { getPrisma } from '../../services/prisma.service.js';
import { uploadObject, getPresignedDownloadUrl } from '../../services/s3.service.js';
import { getEnv } from '../../config/env.js';

export class ReportService {
  private get prisma() {
    return getPrisma();
  }

  private get bucket() {
    return getEnv().S3_BUCKET_REPORTS;
  }

  /**
   * List reports. Since there is no DB model for reports, return an empty array for now.
   */
  async list(_tenantId: string): Promise<unknown[]> {
    return [];
  }

  /**
   * Generate a report, store it in S3, and return metadata with a presigned download URL.
   */
  async generate(
    tenantId: string,
    type: string,
    userId: string
  ): Promise<{ key: string; type: string; generatedAt: string; downloadUrl: string }> {
    let reportData: unknown;

    switch (type) {
      case 'vendor-inventory':
        reportData = await this.assembleVendorInventory(tenantId);
        break;
      case 'risk-summary':
        reportData = await this.assembleRiskSummary(tenantId);
        break;
      case 'compliance-status':
        reportData = await this.assembleComplianceStatus(tenantId);
        break;
      case 'remediation-tracker':
        reportData = await this.assembleRemediationTracker(tenantId);
        break;
      default:
        reportData = { message: `Unknown report type: ${type}` };
    }

    const generatedAt = new Date().toISOString();
    const key = `${tenantId}/reports/${type}_${Date.now()}.json`;

    const payload = JSON.stringify({
      type,
      generatedAt,
      generatedBy: userId,
      tenantId,
      data: reportData,
    });

    await uploadObject(
      this.bucket,
      key,
      Buffer.from(payload, 'utf-8'),
      'application/json'
    );

    const downloadUrl = await getPresignedDownloadUrl(this.bucket, key, 3600);

    return { key, type, generatedAt, downloadUrl };
  }

  /**
   * Get a presigned download URL for an existing report file in S3.
   */
  async getDownloadUrl(
    _tenantId: string,
    key: string
  ): Promise<{ key: string; downloadUrl: string }> {
    const downloadUrl = await getPresignedDownloadUrl(this.bucket, key, 3600);
    return { key, downloadUrl };
  }

  // --- Report data assemblers ---

  private async assembleVendorInventory(tenantId: string) {
    const vendors = await this.prisma.vendor.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            artifacts: true,
            remediations: true,
          },
        },
      },
    });

    return {
      totalVendors: vendors.length,
      vendors: vendors.map((v) => ({
        id: v.id,
        name: v.name,
        stage: v.stage,
        criticality: v.criticality,
        industry: v.industry,
        headquartersCountry: v.headquartersCountry,
        createdAt: v.createdAt,
        artifactCount: v._count.artifacts,
        remediationCount: v._count.remediations,
      })),
    };
  }

  private async assembleRiskSummary(tenantId: string) {
    const [distribution, recentScores] = await Promise.all([
      this.prisma.riskScore.groupBy({
        by: ['inherentRiskLevel'],
        where: {
          isLatest: true,
          vendor: { tenantId },
        },
        _count: { id: true },
      }),
      this.prisma.riskScore.findMany({
        where: {
          isLatest: true,
          vendor: { tenantId },
        },
        orderBy: { calculatedAt: 'desc' },
        take: 20,
        include: {
          vendor: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const riskDistribution: Record<string, number> = {};
    for (const row of distribution) {
      riskDistribution[row.inherentRiskLevel] = row._count.id;
    }

    return {
      riskDistribution,
      recentScores: recentScores.map((s) => ({
        vendorId: s.vendor.id,
        vendorName: s.vendor.name,
        inherentRiskScore: s.inherentRiskScore,
        residualRiskScore: s.residualRiskScore,
        inherentRiskLevel: s.inherentRiskLevel,
        calculatedAt: s.calculatedAt,
      })),
    };
  }

  private async assembleComplianceStatus(tenantId: string) {
    const complianceRecords = await this.prisma.vendorCompliance.findMany({
      where: { vendor: { tenantId } },
      include: {
        vendor: {
          select: { id: true, name: true },
        },
        framework: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ vendor: { name: 'asc' } }, { framework: { name: 'asc' } }],
    });

    return {
      totalRecords: complianceRecords.length,
      matrix: complianceRecords.map((c) => ({
        vendorId: c.vendor.id,
        vendorName: c.vendor.name,
        frameworkId: c.framework.id,
        frameworkName: c.framework.name,
        status: c.status,
        expirationDate: c.expirationDate,
      })),
    };
  }

  private async assembleRemediationTracker(tenantId: string) {
    const remediations = await this.prisma.remediation.findMany({
      where: { vendor: { tenantId } },
      include: {
        vendor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const statusCounts: Record<string, number> = {};
    for (const r of remediations) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return {
      totalRemediations: remediations.length,
      statusCounts,
      remediations: remediations.map((r) => ({
        id: r.id,
        vendorId: r.vendor.id,
        vendorName: r.vendor.name,
        title: r.title,
        status: r.status,
        priority: r.priority,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
      })),
    };
  }
}
