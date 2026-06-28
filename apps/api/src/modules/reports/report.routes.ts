import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReportService } from './report.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const reportService = new ReportService();

const generateReportSchema = z.object({
  type: z.enum([
    'risk-summary',
    'vendor-inventory',
    'compliance-status',
    'remediation-tracker',
  ]),
});

const downloadQuerySchema = z.object({
  key: z.string().min(1),
});

export async function reportRoutes(fastify: FastifyInstance) {
  // List reports (currently returns empty array)
  fastify.get('/', {
    preHandler: [fastify.requirePermission('reports', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const reports = await reportService.list(ctx.effectiveTenantId);

      return reply.send({ success: true, data: reports });
    },
  });

  // Generate a report
  fastify.post('/generate', {
    preHandler: [fastify.requirePermission('reports', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = generateReportSchema.parse(request.body);

      const result = await reportService.generate(
        ctx.effectiveTenantId,
        body.type,
        ctx.userId
      );

      await createAuditLog(
        request,
        'report.generate',
        'Report',
        result.key,
        { type: body.type }
      );

      return reply.status(201).send({ success: true, data: result });
    },
  });

  // Get presigned download URL for a report
  fastify.get('/download', {
    preHandler: [fastify.requirePermission('reports', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = downloadQuerySchema.parse(request.query);

      const result = await reportService.getDownloadUrl(
        ctx.effectiveTenantId,
        query.key
      );

      return reply.send({ success: true, data: result });
    },
  });
}
