import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { UserRole } from '@tprm/shared';
import { getPrisma } from '../services/prisma.service.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: UserRole;
  isMspUser: boolean;
  effectiveTenantId: string; // Tenant being acted upon (may differ from user's tenant for MSP)
}

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext?: TenantContext;
  }
}

async function tenantPlugin(fastify: FastifyInstance) {
  const logger = getLogger();

  fastify.decorate('resolveTenant', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.authUser) {
      throw new UnauthorizedError();
    }

    const prisma = getPrisma();

    // Look up user by Entra Object ID
    let user = await prisma.user.findUnique({
      where: { entraObjectId: request.authUser.entraObjectId },
      include: { tenant: true },
    });

    // JIT provisioning: create user on first login if they don't exist
    if (!user) {
      // For JIT, we need at least one tenant to exist
      // In dev, auto-create under the first MSP tenant
      const mspTenant = await prisma.tenant.findFirst({
        where: { type: 'MSP' },
      });

      if (!mspTenant) {
        throw new UnauthorizedError(
          'No MSP tenant configured. Run database seed first.'
        );
      }

      user = await prisma.user.create({
        data: {
          tenantId: mspTenant.id,
          entraObjectId: request.authUser.entraObjectId,
          email: request.authUser.email,
          displayName: request.authUser.displayName,
          role: 'MSP_ADMIN', // First user gets MSP admin
          lastLoginAt: new Date(),
        },
        include: { tenant: true },
      });

      logger.info(
        { userId: user.id, email: user.email },
        'JIT provisioned new user'
      );
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    if (!user.isActive) {
      throw new ForbiddenError('User account is deactivated');
    }

    if (!user.tenant.isActive) {
      throw new ForbiddenError('Tenant is deactivated');
    }

    const isMspUser = user.role === 'MSP_ADMIN' || user.role === 'MSP_USER';

    // MSP users can act on behalf of a client tenant via header
    let effectiveTenantId = user.tenantId;
    const targetTenantId = request.headers['x-tenant-id'] as string | undefined;

    if (targetTenantId && targetTenantId !== user.tenantId) {
      if (!isMspUser) {
        throw new ForbiddenError(
          'Only MSP users can switch tenant context'
        );
      }
      // Verify target tenant exists and is a child of the MSP tenant
      const targetTenant = await prisma.tenant.findFirst({
        where: {
          id: targetTenantId,
          parentTenantId: user.tenantId,
          isActive: true,
        },
      });
      if (!targetTenant) {
        throw new ForbiddenError('Target tenant not found or not accessible');
      }
      effectiveTenantId = targetTenantId;
    }

    request.tenantContext = {
      tenantId: user.tenantId,
      userId: user.id,
      userRole: user.role as UserRole,
      isMspUser,
      effectiveTenantId,
    };
  });
}

export default fp(tenantPlugin, {
  name: 'tenant',
  dependencies: ['auth'],
});
