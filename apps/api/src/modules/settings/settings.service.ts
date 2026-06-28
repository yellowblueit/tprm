import { getPrisma } from '../../services/prisma.service.js';
import { Prisma } from '@prisma/client';
import type { Tenant, ScoringMatrix, NotificationPreference } from '@prisma/client';

const DEFAULT_NOTIFICATION_PREFS = {
  emailEnabled: true,
  inAppEnabled: true,
  vendorRiskChange: true,
  remediationDue: true,
  assessmentCompleted: true,
  reviewCycleStarted: true,
  complianceExpiring: true,
  monitoringAlert: true,
};

export class SettingsService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * Get tenant record with its settings JSON field.
   */
  async getSettings(tenantId: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    return tenant;
  }

  /**
   * Update the tenant settings JSON field.
   */
  async updateSettings(
    tenantId: string,
    settings: Prisma.InputJsonValue
  ): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });
  }

  /**
   * Get the active scoring matrix for a tenant.
   */
  async getScoringMatrix(tenantId: string): Promise<ScoringMatrix | null> {
    return this.prisma.scoringMatrix.findFirst({
      where: { tenantId, isActive: true },
    });
  }

  /**
   * Upsert the scoring matrix for a tenant.
   * If one exists, update its config. If not, create with name "Default".
   */
  async updateScoringMatrix(
    tenantId: string,
    config: Prisma.InputJsonValue
  ): Promise<ScoringMatrix> {
    const existing = await this.prisma.scoringMatrix.findFirst({
      where: { tenantId, isActive: true },
    });

    if (existing) {
      return this.prisma.scoringMatrix.update({
        where: { id: existing.id },
        data: { config },
      });
    }

    return this.prisma.scoringMatrix.create({
      data: {
        tenantId,
        name: 'Default',
        isActive: true,
        config,
      },
    });
  }

  /**
   * Get notification preferences for a user.
   * Returns default preferences if none are stored.
   */
  async getNotificationPrefs(
    userId: string
  ): Promise<NotificationPreference | { userId: string; preferences: typeof DEFAULT_NOTIFICATION_PREFS }> {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return {
        userId,
        preferences: { ...DEFAULT_NOTIFICATION_PREFS },
      };
    }

    return prefs;
  }

  /**
   * Upsert notification preferences for a user.
   */
  async updateNotificationPrefs(
    userId: string,
    preferences: Prisma.InputJsonValue
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: { preferences },
      create: { userId, preferences },
    });
  }
}
