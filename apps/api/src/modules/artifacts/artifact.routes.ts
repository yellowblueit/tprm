import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ArtifactService } from './artifact.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const artifactService = new ArtifactService();

const updateArtifactSchema = z.object({
  name: z.string().min(1).optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});

export async function artifactRoutes(fastify: FastifyInstance) {
  // List artifacts for a vendor
  fastify.get<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/artifacts',
    {
      preHandler: [fastify.requirePermission('artifacts', 'read')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        const artifacts = await artifactService.listByVendor(
          request.params.vendorId,
          ctx.effectiveTenantId
        );

        return reply.send({ success: true, data: artifacts });
      },
    }
  );

  // Upload an artifact (multipart)
  fastify.post<{ Params: { vendorId: string } }>(
    '/vendors/:vendorId/artifacts',
    {
      preHandler: [fastify.requirePermission('artifacts', 'create')],
      handler: async (request, reply) => {
        const ctx = request.tenantContext!;

        const data = await request.file();
        if (!data) {
          return reply
            .status(400)
            .send({ success: false, error: 'No file uploaded' });
        }

        // Collect file buffer
        const buffer = await data.toBuffer();

        // Extract metadata from multipart fields
        const fields = data.fields;
        const name =
          (fields.name as { value?: string } | undefined)?.value ?? data.filename;
        const type =
          (fields.type as { value?: string } | undefined)?.value ?? 'OTHER';
        const validFrom =
          (fields.validFrom as { value?: string } | undefined)?.value || undefined;
        const validUntil =
          (fields.validUntil as { value?: string } | undefined)?.value || undefined;

        const artifact = await artifactService.upload(
          request.params.vendorId,
          ctx.effectiveTenantId,
          {
            buffer,
            filename: data.filename,
            mimetype: data.mimetype,
          },
          { name, type, validFrom, validUntil },
          ctx.userId
        );

        await createAuditLog(
          request,
          'artifact.upload',
          'SecurityArtifact',
          artifact.id,
          {
            vendorId: request.params.vendorId,
            fileName: data.filename,
            type,
          }
        );

        return reply.status(201).send({ success: true, data: artifact });
      },
    }
  );

  // Get presigned download URL for an artifact
  fastify.get<{ Params: { id: string } }>('/artifacts/:id/download', {
    preHandler: [fastify.requirePermission('artifacts', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const download = await artifactService.getDownloadUrl(
        request.params.id,
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: download });
    },
  });

  // Update artifact metadata
  fastify.patch<{ Params: { id: string } }>('/artifacts/:id', {
    preHandler: [fastify.requirePermission('artifacts', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateArtifactSchema.parse(request.body);

      const artifact = await artifactService.update(
        request.params.id,
        ctx.effectiveTenantId,
        {
          name: body.name,
          validFrom: body.validFrom ?? undefined,
          validUntil: body.validUntil ?? undefined,
        }
      );

      await createAuditLog(
        request,
        'artifact.update',
        'SecurityArtifact',
        artifact.id,
        body
      );

      return reply.send({ success: true, data: artifact });
    },
  });

  // Delete an artifact
  fastify.delete<{ Params: { id: string } }>('/artifacts/:id', {
    preHandler: [fastify.requirePermission('artifacts', 'delete')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      await artifactService.softDelete(
        request.params.id,
        ctx.effectiveTenantId
      );

      await createAuditLog(
        request,
        'artifact.delete',
        'SecurityArtifact',
        request.params.id
      );

      return reply.send({ success: true });
    },
  });
}
