import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReviewCycleService } from './review-cycle.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const reviewCycleService = new ReviewCycleService();

const createReviewCycleSchema = z.object({
  startDate: z.string().datetime(),
  dueDate: z.string().datetime(),
});

const updateReviewCycleSchema = z.object({
  status: z.string().optional(),
  notes: z.string().max(10000).optional(),
  completedDate: z.string().datetime().optional(),
});

export async function reviewCycleRoutes(fastify: FastifyInstance) {
  // List review cycles for a vendor
  fastify.get<{ Params: { vendorId: string } }>('/vendors/:vendorId/reviews', {
    preHandler: [fastify.requirePermission('review-cycles', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const cycles = await reviewCycleService.listByVendor(
        request.params.vendorId,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: cycles });
    },
  });

  // Create a new review cycle for a vendor
  fastify.post<{ Params: { vendorId: string } }>('/vendors/:vendorId/reviews', {
    preHandler: [fastify.requirePermission('review-cycles', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = createReviewCycleSchema.parse(request.body);

      const cycle = await reviewCycleService.create(
        request.params.vendorId,
        ctx.effectiveTenantId,
        ctx.userId,
        body
      );

      await createAuditLog(request, 'reviewCycle.create', 'ReviewCycle', cycle.id);

      return reply.status(201).send({ success: true, data: cycle });
    },
  });

  // Update a review cycle
  fastify.patch<{ Params: { id: string } }>('/review-cycles/:id', {
    preHandler: [fastify.requirePermission('review-cycles', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateReviewCycleSchema.parse(request.body);

      const cycle = await reviewCycleService.update(
        request.params.id,
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(request, 'reviewCycle.update', 'ReviewCycle', cycle.id, body);

      return reply.send({ success: true, data: cycle });
    },
  });
}
