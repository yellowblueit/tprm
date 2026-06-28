import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SubprocessorService } from './subprocessor.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const subprocessorService = new SubprocessorService();

const linkSubprocessorSchema = z.object({
  subprocessorId: z.string().uuid(),
  serviceProvided: z.string().optional(),
  dataShared: z.string().optional(),
  riskLevel: z.string().optional(),
});

export async function subprocessorRoutes(fastify: FastifyInstance) {
  // List all global subprocessors
  fastify.get('/', {
    preHandler: [fastify.requirePermission('subprocessors', 'read')],
    handler: async (request, reply) => {
      const subprocessors = await subprocessorService.listAll();
      return reply.send({ success: true, data: subprocessors });
    },
  });
}

export async function vendorSubprocessorRoutes(fastify: FastifyInstance) {
  // List subprocessors linked to a vendor
  fastify.get<{ Params: { vendorId: string } }>('/:vendorId/subprocessors', {
    preHandler: [fastify.requirePermission('subprocessors', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { vendorId } = request.params;

      const links = await subprocessorService.listByVendor(
        vendorId,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: links });
    },
  });

  // Link a subprocessor to a vendor
  fastify.post<{ Params: { vendorId: string } }>('/:vendorId/subprocessors', {
    preHandler: [fastify.requirePermission('subprocessors', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { vendorId } = request.params;
      const body = linkSubprocessorSchema.parse(request.body);

      const link = await subprocessorService.link(
        vendorId,
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(
        request,
        'subprocessor.link',
        'Vendor',
        vendorId,
        { subprocessorId: body.subprocessorId }
      );

      return reply.status(201).send({ success: true, data: link });
    },
  });

  // Unlink a subprocessor from a vendor
  fastify.delete<{ Params: { vendorId: string; subprocessorId: string } }>(
    '/:vendorId/subprocessors/:subprocessorId',
    {
      preHandler: [fastify.requirePermission('subprocessors', 'delete')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;
        const { vendorId, subprocessorId } = request.params;

        await subprocessorService.unlink(
          vendorId,
          ctx.effectiveTenantId,
          subprocessorId
        );

        await createAuditLog(
          request,
          'subprocessor.unlink',
          'Vendor',
          vendorId,
          { subprocessorId }
        );

        return reply.send({ success: true });
      },
    }
  );
}
