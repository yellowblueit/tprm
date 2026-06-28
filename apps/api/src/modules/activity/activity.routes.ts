import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ActivityService } from './activity.service.js';
import { paginationSchema } from '@tprm/shared';

const activityService = new ActivityService();

const vendorActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function activityRoutes(fastify: FastifyInstance) {
  // List all activity for the tenant (paginated)
  fastify.get('/', {
    preHandler: [fastify.requirePermission('activity', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);

      const result = await activityService.listByTenant(
        ctx.effectiveTenantId,
        query.page,
        query.pageSize
      );

      return reply.send({ success: true, ...result });
    },
  });
}

export async function vendorActivityRoutes(fastify: FastifyInstance) {
  // List activity for a specific vendor
  fastify.get<{ Params: { vendorId: string } }>('/:vendorId/activity', {
    preHandler: [fastify.requirePermission('activity', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { vendorId } = request.params;
      const query = vendorActivityQuerySchema.parse(request.query);

      const logs = await activityService.listByVendor(
        vendorId,
        ctx.effectiveTenantId,
        query.limit
      );

      return reply.send({ success: true, data: logs });
    },
  });
}
