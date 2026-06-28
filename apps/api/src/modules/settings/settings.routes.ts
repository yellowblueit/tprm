import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { SettingsService } from './settings.service.js';
import { createAuditLog } from '../../middleware/audit-log.js';

const settingsService = new SettingsService();

const updateSettingsSchema = z.object({}).passthrough();

const updateScoringMatrixSchema = z.object({}).passthrough();

const updateNotificationPrefsSchema = z.object({}).passthrough();

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get tenant settings
  fastify.get('/', {
    preHandler: [fastify.requirePermission('settings', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const tenant = await settingsService.getSettings(ctx.effectiveTenantId);

      return reply.send({ success: true, data: tenant });
    },
  });

  // Update tenant settings
  fastify.patch('/', {
    preHandler: [fastify.requirePermission('settings', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateSettingsSchema.parse(request.body);

      const tenant = await settingsService.updateSettings(
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(
        request,
        'settings.update',
        'Tenant',
        ctx.effectiveTenantId,
        body as Prisma.InputJsonValue
      );

      return reply.send({ success: true, data: tenant });
    },
  });

  // Get active scoring matrix
  fastify.get('/scoring-matrix', {
    preHandler: [fastify.requirePermission('settings', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const matrix = await settingsService.getScoringMatrix(
        ctx.effectiveTenantId
      );

      return reply.send({ success: true, data: matrix });
    },
  });

  // Update scoring matrix
  fastify.put('/scoring-matrix', {
    preHandler: [fastify.requirePermission('settings', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateScoringMatrixSchema.parse(request.body);

      const matrix = await settingsService.updateScoringMatrix(
        ctx.effectiveTenantId,
        body
      );

      await createAuditLog(
        request,
        'settings.updateScoringMatrix',
        'ScoringMatrix',
        matrix.id,
        body as Prisma.InputJsonValue
      );

      return reply.send({ success: true, data: matrix });
    },
  });

  // Get notification preferences for the current user
  fastify.get('/notifications', {
    preHandler: [fastify.requirePermission('settings', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;

      const prefs = await settingsService.getNotificationPrefs(ctx.userId);

      return reply.send({ success: true, data: prefs });
    },
  });

  // Update notification preferences for the current user
  fastify.put('/notifications', {
    preHandler: [fastify.requirePermission('settings', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateNotificationPrefsSchema.parse(request.body);

      const prefs = await settingsService.updateNotificationPrefs(
        ctx.userId,
        body
      );

      await createAuditLog(
        request,
        'settings.updateNotificationPrefs',
        'NotificationPreference',
        ctx.userId,
        body as Prisma.InputJsonValue
      );

      return reply.send({ success: true, data: prefs });
    },
  });
}
