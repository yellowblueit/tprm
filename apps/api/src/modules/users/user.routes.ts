import type { FastifyInstance } from 'fastify';
import { UserService } from './user.service.js';
import { inviteUserSchema, updateUserRoleSchema, paginationSchema } from '@tprm/shared';
import { createAuditLog } from '../../middleware/audit-log.js';

const userService = new UserService();

export async function userRoutes(fastify: FastifyInstance) {
  // Get current user profile
  fastify.get('/me', async (request, reply) => {
    const user = await userService.getCurrentUser(
      request.authUser!.entraObjectId
    );
    return reply.send({ success: true, data: user });
  });

  // List users for current tenant
  fastify.get('/', {
    preHandler: [fastify.requirePermission('users', 'read')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const query = paginationSchema.parse(request.query);

      const result = await userService.list(
        ctx.effectiveTenantId,
        query.page,
        query.pageSize,
        query.search
      );

      return reply.send({ success: true, ...result });
    },
  });

  // Invite user to tenant
  fastify.post('/invite', {
    preHandler: [fastify.requirePermission('users', 'create')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = inviteUserSchema.parse(request.body);

      const user = await userService.invite({
        tenantId: ctx.effectiveTenantId,
        ...body,
      });

      await createAuditLog(request, 'user.invite', 'User', user.id);

      return reply.status(201).send({ success: true, data: user });
    },
  });

  // Update user role
  fastify.patch<{ Params: { id: string } }>('/:id/role', {
    preHandler: [fastify.requirePermission('users', 'update')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const body = updateUserRoleSchema.parse(request.body);

      const user = await userService.updateRole(
        request.params.id,
        ctx.effectiveTenantId,
        body.role
      );

      await createAuditLog(request, 'user.updateRole', 'User', user.id, {
        role: body.role,
      });

      return reply.send({ success: true, data: user });
    },
  });

  // Deactivate user
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.requirePermission('users', 'delete')],
    handler: async (request, reply) => {
      const ctx = request.tenantContext!;
      const user = await userService.deactivate(
        request.params.id,
        ctx.effectiveTenantId
      );

      await createAuditLog(request, 'user.deactivate', 'User', user.id);

      return reply.send({ success: true, data: user });
    },
  });
}
