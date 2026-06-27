import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { VendorService } from './vendor.service.js';
import {
  createVendorSchema,
  updateVendorSchema,
  updateVendorStageSchema,
  setBusinessCasesSchema,
  setDataClassificationsSchema,
  assignVendorOwnerSchema,
  paginationSchema,
} from '@tprm/shared';
import { createAuditLog } from '../../middleware/audit-log.js';

const vendorService = new VendorService();

const vendorFilterSchema = z.object({
  stage: z.string().optional(),
  criticality: z.string().optional(),
  riskLevel: z.string().optional(),
});

export async function vendorRoutes(fastify: FastifyInstance) {
  // List vendors with pagination, search, and filters
  fastify.get('/', {
    preHandler: [fastify.requirePermission('vendors', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);
      const filters = vendorFilterSchema.parse(request.query);

      const result = await vendorService.list(
        ctx.effectiveTenantId,
        query.page,
        query.pageSize,
        query.search,
        filters
      );

      return reply.send({ success: true, ...result });
    },
  });

  // Create a new vendor
  fastify.post('/', {
    preHandler: [fastify.requirePermission('vendors', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = createVendorSchema.parse(request.body);

      const vendor = await vendorService.create(ctx.effectiveTenantId, {
        name: body.name,
        website: body.website || undefined,
        description: body.description,
        industry: body.industry,
        headquartersCountry: body.headquartersCountry,
        employeeCount: body.employeeCount,
        yearFounded: body.yearFounded,
        criticality: body.criticality,
        businessCases: body.businessCases,
        dataClassificationIds: body.dataClassificationIds,
        reviewFrequencyMonths: body.reviewFrequencyMonths,
      });

      await createAuditLog(request, 'vendor.create', 'Vendor', vendor.id);

      return reply.status(201).send({ success: true, data: vendor });
    },
  });

  // Get vendor detail by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('vendors', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const vendor = await vendorService.getById(
        request.params.id,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: vendor });
    },
  });

  // Update vendor basic fields
  fastify.patch<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('vendors', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateVendorSchema.parse(request.body);

      const vendor = await vendorService.update(
        request.params.id,
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(request, 'vendor.update', 'Vendor', vendor.id, body);

      return reply.send({ success: true, data: vendor });
    },
  });

  // Soft-delete a vendor (set stage to OFFBOARDED)
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('vendors', 'delete')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const vendor = await vendorService.softDelete(
        request.params.id,
        ctx.effectiveTenantId
      );

      await createAuditLog(request, 'vendor.delete', 'Vendor', vendor.id);

      return reply.send({ success: true, data: vendor });
    },
  });

  // Update vendor stage
  fastify.patch<{ Params: { id: string } }>('/:id/stage', {
    preHandler: [fastify.requirePermission('vendors', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateVendorStageSchema.parse(request.body);

      const vendor = await vendorService.updateStage(
        request.params.id,
        ctx.effectiveTenantId,
        body.stage
      );

      await createAuditLog(request, 'vendor.updateStage', 'Vendor', vendor.id, {
        stage: body.stage,
      });

      return reply.send({ success: true, data: vendor });
    },
  });

  // Set business cases for a vendor (replace all)
  fastify.put<{ Params: { id: string } }>('/:id/business-cases', {
    preHandler: [fastify.requirePermission('vendors', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = setBusinessCasesSchema.parse(request.body);

      await vendorService.setBusinessCases(
        request.params.id,
        ctx.effectiveTenantId,
        body.businessCases
      );

      await createAuditLog(
        request,
        'vendor.setBusinessCases',
        'Vendor',
        request.params.id,
        { businessCases: body.businessCases }
      );

      return reply.send({ success: true });
    },
  });

  // Set data classifications for a vendor (replace all)
  fastify.put<{ Params: { id: string } }>('/:id/data-classifications', {
    preHandler: [fastify.requirePermission('vendors', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = setDataClassificationsSchema.parse(request.body);

      await vendorService.setDataClassifications(
        request.params.id,
        ctx.effectiveTenantId,
        body.dataClassificationIds
      );

      await createAuditLog(
        request,
        'vendor.setDataClassifications',
        'Vendor',
        request.params.id,
        { dataClassificationIds: body.dataClassificationIds }
      );

      return reply.send({ success: true });
    },
  });

  // Get vendor owners
  fastify.get<{ Params: { id: string } }>('/:id/owners', {
    preHandler: [fastify.requirePermission('vendors', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const owners = await vendorService.getOwners(
        request.params.id,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: owners });
    },
  });

  // Add an owner to a vendor
  fastify.post<{ Params: { id: string } }>('/:id/owners', {
    preHandler: [fastify.requirePermission('vendors', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = assignVendorOwnerSchema.parse(request.body);

      const owner = await vendorService.addOwner(
        request.params.id,
        ctx.effectiveTenantId,
        body.userId,
        body.isPrimary
      );

      await createAuditLog(
        request,
        'vendor.addOwner',
        'Vendor',
        request.params.id,
        { userId: body.userId, isPrimary: body.isPrimary }
      );

      return reply.status(201).send({ success: true, data: owner });
    },
  });

  // Remove an owner from a vendor
  fastify.delete<{ Params: { id: string; userId: string } }>(
    '/:id/owners/:userId',
    {
      preHandler: [fastify.requirePermission('vendors', 'update')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        await vendorService.removeOwner(
          request.params.id,
          ctx.effectiveTenantId,
          request.params.userId
        );

        await createAuditLog(
          request,
          'vendor.removeOwner',
          'Vendor',
          request.params.id,
          { userId: request.params.userId }
        );

        return reply.send({ success: true });
      },
    }
  );
}
