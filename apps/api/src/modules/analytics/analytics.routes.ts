import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AnalyticsService } from './analytics.service.js';

const analyticsService = new AnalyticsService();

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Dashboard metrics
  fastify.get('/dashboard/metrics', {
    preHandler: [fastify.requirePermission('analytics', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const metrics = await analyticsService.getDashboardMetrics(
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: metrics });
    },
  });

  // Risk distribution (vendor count by inherent risk level)
  fastify.get('/analytics/risk-distribution', {
    preHandler: [fastify.requirePermission('analytics', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const distribution = await analyticsService.getRiskDistribution(
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: distribution });
    },
  });

  // Risk trend (monthly average scores)
  fastify.get('/analytics/risk-trend', {
    preHandler: [fastify.requirePermission('analytics', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = z
        .object({ months: z.coerce.number().int().min(1).max(24).default(6) })
        .parse(request.query);

      const trend = await analyticsService.getRiskTrend(
        ctx.effectiveTenantId,
        query.months
      );

      return reply.send({ success: true, data: trend });
    },
  });

  // Vendor pipeline (count by stage)
  fastify.get('/analytics/vendor-pipeline', {
    preHandler: [fastify.requirePermission('analytics', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const pipeline = await analyticsService.getVendorPipeline(
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: pipeline });
    },
  });

  // Remediation stats (count by status)
  fastify.get('/analytics/remediation-stats', {
    preHandler: [fastify.requirePermission('analytics', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const stats = await analyticsService.getRemediationStats(
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: stats });
    },
  });
}
