import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MonitoringService } from './monitoring.service.js';
import { paginationSchema } from '@tprm/shared';
import { createAuditLog } from '../../middleware/audit-log.js';

const monitoringService = new MonitoringService();

const alertFilterSchema = z.object({
  severity: z.string().optional(),
  type: z.string().optional(),
  vendorId: z.string().optional(),
  acknowledged: z.string().optional(),
});

const createAlertSchema = z.object({
  vendorId: z.string().uuid(),
  type: z.string(),
  severity: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10000),
  sourceUrl: z.string().url().optional(),
  riskImpact: z.number().min(0).max(100).optional(),
});

const updateAlertSchema = z.object({
  acknowledged: z.boolean().optional(),
  dismissed: z.boolean().optional(),
});

export async function monitoringRoutes(fastify: FastifyInstance) {
  // List alerts with pagination and filters
  fastify.get('/monitoring/alerts', {
    preHandler: [fastify.requirePermission('monitoring', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);
      const filters = alertFilterSchema.parse(request.query);

      const result = await monitoringService.list(
        ctx.effectiveTenantId,
        query.page,
        query.pageSize,
        filters
      );

      return reply.send({ success: true, ...result });
    },
  });

  // List alerts for a specific vendor
  fastify.get<{ Params: { vendorId: string } }>('/vendors/:vendorId/alerts', {
    preHandler: [fastify.requirePermission('monitoring', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const alerts = await monitoringService.listByVendor(
        request.params.vendorId,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: alerts });
    },
  });

  // Create a new monitoring alert
  fastify.post('/monitoring/alerts', {
    preHandler: [fastify.requirePermission('monitoring', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = createAlertSchema.parse(request.body);

      const alert = await monitoringService.create(ctx.effectiveTenantId, body);

      await createAuditLog(request, 'monitoring.createAlert', 'MonitoringAlert', alert.id);

      return reply.status(201).send({ success: true, data: alert });
    },
  });

  // Update (acknowledge/dismiss) an alert
  fastify.patch<{ Params: { id: string } }>('/monitoring/alerts/:id', {
    preHandler: [fastify.requirePermission('monitoring', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateAlertSchema.parse(request.body);

      const alert = await monitoringService.update(
        request.params.id,
        ctx.effectiveTenantId,
        body,
        ctx.userId
      );

      await createAuditLog(request, 'monitoring.updateAlert', 'MonitoringAlert', alert.id, body);

      return reply.send({ success: true, data: alert });
    },
  });
}
