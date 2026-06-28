import type { FastifyInstance } from 'fastify';
import { RiskScoringService } from './risk-scoring.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const riskScoringService = new RiskScoringService();

export async function riskScoringRoutes(fastify: FastifyInstance) {
  // List all risk scores for a vendor
  fastify.get<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/risk-scores',
    {
      preHandler: [fastify.requirePermission('risk-scores', 'read')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        const scores = await riskScoringService.listByVendor(
          request.params.vendorId,
          ctx.effectiveTenantId
        );

        return reply.send({ success: true, data: scores });
      },
    }
  );

  // Get the latest risk score for a vendor
  fastify.get<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/risk-scores/latest',
    {
      preHandler: [fastify.requirePermission('risk-scores', 'read')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        const score = await riskScoringService.getLatest(
          request.params.vendorId,
          ctx.effectiveTenantId
        );

        return reply.send({ success: true, data: score });
      },
    }
  );

  // Calculate a new risk score for a vendor
  fastify.post<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/risk-scores',
    {
      preHandler: [fastify.requirePermission('risk-scores', 'create')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        const score = await riskScoringService.calculate(
          request.params.vendorId,
          ctx.effectiveTenantId,
          ctx.userId
        );

        await createAuditLog(
          request,
          'riskScore.calculate',
          'RiskScore',
          score.id,
          {
            vendorId: request.params.vendorId,
            inherentRiskScore: score.inherentRiskScore,
            inherentRiskLevel: score.inherentRiskLevel,
            residualRiskScore: score.residualRiskScore,
            residualRiskLevel: score.residualRiskLevel,
          }
        );

        return reply.status(201).send({ success: true, data: score });
      },
    }
  );
}
