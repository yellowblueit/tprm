import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { VendorCatalogService } from './vendor-catalog.service.js';
import { paginationSchema } from '@tprm/shared';
import { createAuditLog } from '../../middleware/audit-log.js';

const vendorCatalogService = new VendorCatalogService();

const createCatalogVendorSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
});

const assignToTenantSchema = z.object({
  criticality: z.string().min(1),
});

export async function vendorCatalogRoutes(fastify: FastifyInstance) {
  // List catalog vendors with optional search and pagination
  fastify.get('/', {
    preHandler: [fastify.requirePermission('catalog', 'read')],
    handler: async (request, reply) => {
      const query = paginationSchema.parse(request.query);

      const result = await vendorCatalogService.list(
        query.search,
        query.page,
        query.pageSize
      );

      return reply.send({ success: true, ...result });
    },
  });

  // Create a new catalog vendor
  fastify.post('/', {
    preHandler: [fastify.requirePermission('catalog', 'create')],
    handler: async (request, reply) => {
      const body = createCatalogVendorSchema.parse(request.body);

      const catalogVendor = await vendorCatalogService.create(body);

      await createAuditLog(
        request,
        'catalog.create',
        'CatalogVendor',
        catalogVendor.id
      );

      return reply.status(201).send({ success: true, data: catalogVendor });
    },
  });

  // Assign a catalog vendor to the current tenant
  fastify.post<{ Params: { id: string } }>('/:id/assign', {
    preHandler: [fastify.requirePermission('catalog', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const { id } = request.params;
      const body = assignToTenantSchema.parse(request.body);

      const vendor = await vendorCatalogService.assignToTenant(
        id,
        ctx.effectiveTenantId,
        body.criticality
      );

      await createAuditLog(
        request,
        'catalog.assignToTenant',
        'Vendor',
        vendor.id,
        { catalogVendorId: id, criticality: body.criticality }
      );

      return reply.status(201).send({ success: true, data: vendor });
    },
  });
}
