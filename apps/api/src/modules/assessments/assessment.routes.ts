import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AssessmentService } from './assessment.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const assessmentService = new AssessmentService();

const upsertAssessmentSchema = z.object({
  domainId: z.string().uuid(),
  maturityLevel: z.string(),
  controlEffectiveness: z.number().min(0).max(100).optional(),
  gapDescription: z.string().optional(),
  findings: z.string().optional(),
});

export async function assessmentRoutes(fastify: FastifyInstance) {
  // List domain assessments for a vendor
  fastify.get<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/assessments',
    {
      preHandler: [fastify.requirePermission('assessments', 'read')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        const assessments = await assessmentService.listByVendor(
          request.params.vendorId,
          ctx.effectiveTenantId
        );

        return reply.send({ success: true, data: assessments });
      },
    }
  );

  // Upsert a domain assessment for a vendor
  fastify.put<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/assessments',
    {
      preHandler: [fastify.requirePermission('assessments', 'update')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;
        const body = upsertAssessmentSchema.parse(request.body);

        const assessment = await assessmentService.upsert(
          request.params.vendorId,
          ctx.effectiveTenantId,
          body
        );

        await createAuditLog(
          request,
          'assessment.upsert',
          'DomainAssessment',
          assessment.id,
          {
            vendorId: request.params.vendorId,
            domainId: body.domainId,
            maturityLevel: body.maturityLevel,
          }
        );

        return reply.send({ success: true, data: assessment });
      },
    }
  );

  // Get aggregate assessment summary for the tenant
  fastify.get('/assessments/summary', {
    preHandler: [fastify.requirePermission('assessments', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const summary = await assessmentService.getSummary(
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: summary });
    },
  });
}
