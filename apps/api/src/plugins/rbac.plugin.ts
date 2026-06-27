import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { hasPermission, type UserRole } from '@tprm/shared';
import { ForbiddenError } from '../utils/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    resolveTenant: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (resource: string, action: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function rbacPlugin(fastify: FastifyInstance) {
  fastify.decorate('requirePermission', function (
    resource: string,
    action: string
  ) {
    return async function (request: FastifyRequest, _reply: FastifyReply) {
      if (!request.tenantContext) {
        throw new ForbiddenError('Tenant context not resolved');
      }

      const { userRole } = request.tenantContext;

      if (!hasPermission(userRole as UserRole, resource, action)) {
        throw new ForbiddenError(
          `Insufficient permissions for ${action} on ${resource}`
        );
      }
    };
  });
}

export default fp(rbacPlugin, {
  name: 'rbac',
  dependencies: ['tenant'],
});
