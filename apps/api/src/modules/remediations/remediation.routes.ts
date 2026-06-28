import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RemediationService } from './remediation.service.js';
import {
  createRemediationSchema,
  updateRemediationSchema,
  createRemediationCommentSchema,
  paginationSchema,
} from '@tprm/shared';
import { createAuditLog } from '../../middleware/audit-log.js';

const remediationService = new RemediationService();

const remediationFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  vendorId: z.string().optional(),
});

export async function remediationRoutes(fastify: FastifyInstance) {
  // List remediations with pagination and filters
  fastify.get('/remediations', {
    preHandler: [fastify.requirePermission('remediations', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);
      const filters = remediationFilterSchema.parse(request.query);

      const result = await remediationService.list(
        ctx.effectiveTenantId,
        query.page,
        query.pageSize,
        filters
      );

      return reply.send({ success: true, ...result });
    },
  });

  // List remediations for a specific vendor
  fastify.get<{ Params: { vendorId: string } }>('/vendors/:vendorId/remediations', {
    preHandler: [fastify.requirePermission('remediations', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);

      const result = await remediationService.listByVendor(
        request.params.vendorId,
        ctx.effectiveTenantId,
        query.page,
        query.pageSize
      );

      return reply.send({ success: true, ...result });
    },
  });

  // Create a remediation for a vendor
  fastify.post<{ Params: { vendorId: string } }>('/vendors/:vendorId/remediations', {
    preHandler: [fastify.requirePermission('remediations', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = createRemediationSchema.parse(request.body);

      const remediation = await remediationService.create(
        request.params.vendorId,
        ctx.effectiveTenantId,
        ctx.userId,
        body
      );

      await createAuditLog(request, 'remediation.create', 'Remediation', remediation.id);

      return reply.status(201).send({ success: true, data: remediation });
    },
  });

  // Update a remediation
  fastify.patch<{ Params: { id: string } }>('/remediations/:id', {
    preHandler: [fastify.requirePermission('remediations', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateRemediationSchema.parse(request.body);

      const remediation = await remediationService.update(
        request.params.id,
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(request, 'remediation.update', 'Remediation', remediation.id, body);

      return reply.send({ success: true, data: remediation });
    },
  });

  // List comments for a remediation
  fastify.get<{ Params: { id: string } }>('/remediations/:id/comments', {
    preHandler: [fastify.requirePermission('remediations', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const comments = await remediationService.listComments(
        request.params.id,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: comments });
    },
  });

  // Add a comment to a remediation
  fastify.post<{ Params: { id: string } }>('/remediations/:id/comments', {
    preHandler: [fastify.requirePermission('remediations', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = createRemediationCommentSchema.parse(request.body);

      const comment = await remediationService.addComment(
        request.params.id,
        ctx.effectiveTenantId,
        ctx.userId,
        body.content
      );

      await createAuditLog(request, 'remediation.addComment', 'RemediationComment', comment.id);

      return reply.status(201).send({ success: true, data: comment });
    },
  });
}
