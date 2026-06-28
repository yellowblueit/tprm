import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ComplianceService } from './compliance.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const complianceService = new ComplianceService();

const upsertComplianceSchema = z.object({
  frameworkId: z.string().uuid(),
  status: z.string(),
  certificationDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  notes: z.string().max(10000).optional(),
});

export async function complianceRoutes(fastify: FastifyInstance) {
  // List all active compliance frameworks
  fastify.get('/compliance/frameworks', {
    preHandler: [fastify.requirePermission('compliance', 'read')],
    handler: async (_request, reply) => {
      const frameworks = await complianceService.listFrameworks();

      return reply.send({ success: true, data: frameworks });
    },
  });

  // Get compliance records for a vendor
  fastify.get<{ Params: { vendorId: string } }>('/vendors/:vendorId/compliance', {
    preHandler: [fastify.requirePermission('compliance', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const compliance = await complianceService.getVendorCompliance(
        request.params.vendorId,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: compliance });
    },
  });

  // Upsert a vendor compliance record
  fastify.put<{ Params: { vendorId: string } }>('/vendors/:vendorId/compliance', {
    preHandler: [fastify.requirePermission('compliance', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = upsertComplianceSchema.parse(request.body);

      const compliance = await complianceService.upsertCompliance(
        request.params.vendorId,
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(
        request,
        'compliance.upsert',
        'VendorCompliance',
        compliance.id,
        body
      );

      return reply.send({ success: true, data: compliance });
    },
  });

  // Get compliance matrix across all vendors
  fastify.get('/compliance/matrix', {
    preHandler: [fastify.requirePermission('compliance', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const matrix = await complianceService.getMatrix(ctx.effectiveTenantId);

      return reply.send({ success: true, data: matrix });
    },
  });
}
