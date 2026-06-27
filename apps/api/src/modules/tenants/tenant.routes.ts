import type { FastifyInstance } from 'fastify';
import { TenantService } from './tenant.service.js';
import { createTenantSchema, updateTenantSchema, paginationSchema } from '@tprm/shared';
import { createAuditLog } from '../../middleware/audit-log.js';

const tenantService = new TenantService();

export async function tenantRoutes(fastify: FastifyInstance) {
  // List client tenants (MSP only)
  fastify.get('/', {
    preHandler: [fastify.requirePermission('tenants', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);

      const result = await tenantService.list(
        ctx.tenantId,
        query.page,
        query.pageSize,
        query.search
      );

      return reply.send({ success: true, ...result });
    },
  });

  // Get tenant by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('tenants', 'read')],
    handler: async (request, reply) => {
      const tenant = await tenantService.getById(request.params.id);
      return reply.send({ success: true, data: tenant });
    },
  });

  // Create new client tenant (MSP only)
  fastify.post('/', {
    preHandler: [fastify.requirePermission('tenants', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = createTenantSchema.parse(request.body);

      const tenant = await tenantService.create({
        name: body.name,
        slug: body.slug,
        parentTenantId: ctx.tenantId,
      });

      await createAuditLog(request, 'tenant.create', 'Tenant', tenant.id);

      return reply.status(201).send({ success: true, data: tenant });
    },
  });

  // Update tenant
  fastify.patch<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('tenants', 'update')],
    handler: async (request, reply) => {
      const body = updateTenantSchema.parse(request.body);
      const tenant = await tenantService.update(request.params.id, body);

      await createAuditLog(request, 'tenant.update', 'Tenant', tenant.id, body as unknown as import('@prisma/client').Prisma.InputJsonValue);

      return reply.send({ success: true, data: tenant });
    },
  });

  // Deactivate tenant
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('tenants', 'delete')],
    handler: async (request, reply) => {
      const tenant = await tenantService.deactivate(request.params.id);

      await createAuditLog(request, 'tenant.deactivate', 'Tenant', tenant.id);

      return reply.send({ success: true, data: tenant });
    },
  });
}
