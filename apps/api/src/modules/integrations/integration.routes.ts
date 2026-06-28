import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { IntegrationService } from './integration.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const integrationService = new IntegrationService();

const upsertIntegrationSchema = z.object({
  displayName: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  credentials: z.record(z.string()).optional(),
});

export async function integrationRoutes(fastify: FastifyInstance) {
  // List all integrations for the tenant
  fastify.get('/', {
    preHandler: [fastify.requirePermission('settings', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const integrations = await integrationService.list(ctx.effectiveTenantId);

      return reply.send({ success: true, data: integrations });
    },
  });

  // Get a single integration by type
  fastify.get<{ Params: { type: string } }>('/:type', {
    preHandler: [fastify.requirePermission('settings', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { type } = request.params;

      const integration = await integrationService.get(
        ctx.effectiveTenantId,
        type.toUpperCase()
      );

      return reply.send({ success: true, data: integration });
    },
  });

  // Upsert an integration
  fastify.put<{ Params: { type: string } }>('/:type', {
    preHandler: [fastify.requirePermission('settings', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { type } = request.params;
      const body = upsertIntegrationSchema.parse(request.body);

      const integration = await integrationService.upsert(
        ctx.effectiveTenantId,
        type.toUpperCase(),
        body
      );

      await createAuditLog(
        request,
        'integration.upsert',
        'TenantIntegration',
        integration.id,
        { type: type.toUpperCase(), displayName: body.displayName }
      );

      return reply.send({ success: true, data: integration });
    },
  });

  // Delete an integration
  fastify.delete<{ Params: { type: string } }>('/:type', {
    preHandler: [fastify.requirePermission('settings', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { type } = request.params;

      await integrationService.delete(
        ctx.effectiveTenantId,
        type.toUpperCase()
      );

      await createAuditLog(
        request,
        'integration.delete',
        'TenantIntegration',
        type.toUpperCase(),
        { type: type.toUpperCase() }
      );

      return reply.send({ success: true });
    },
  });

  // Test integration connection
  fastify.post<{ Params: { type: string } }>('/:type/test', {
    preHandler: [fastify.requirePermission('settings', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { type } = request.params;

      const result = await integrationService.testConnection(
        ctx.effectiveTenantId,
        type.toUpperCase()
      );

      await createAuditLog(
        request,
        'integration.test',
        'TenantIntegration',
        type.toUpperCase(),
        { type: type.toUpperCase(), success: result.success }
      );

      return reply.send({ success: true, data: result });
    },
  });
}
