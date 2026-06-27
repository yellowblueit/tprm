import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { getEnv } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

export interface AuthUser {
  entraObjectId: string;
  email: string;
  displayName: string;
  roles: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  const env = getEnv();
  const logger = getLogger();

  const jwksUrl = new URL(
    `https://login.microsoftonline.com/${env.ENTRA_TENANT_ID}/discovery/v2.0/keys`
  );

  let jwks: ReturnType<typeof createRemoteJWKSet>;

  try {
    jwks = createRemoteJWKSet(jwksUrl);
  } catch (err) {
    logger.warn('Failed to initialize JWKS - auth will use dev mode');
  }

  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    // Development mode: accept a special dev token format
    if (env.NODE_ENV === 'development' && token.startsWith('dev:')) {
      const parts = token.slice(4).split(':');
      request.authUser = {
        entraObjectId: parts[0] || 'dev-user-id',
        email: parts[1] || 'dev@tprm.local',
        displayName: parts[2] || 'Dev User',
        roles: parts[3]?.split(',') || ['MSP_ADMIN'],
      };
      return;
    }

    try {
      const { payload } = await jwtVerify(token, jwks!, {
        issuer: `https://login.microsoftonline.com/${env.ENTRA_TENANT_ID}/v2.0`,
        audience: `api://${env.ENTRA_CLIENT_ID}`,
      });

      request.authUser = {
        entraObjectId: (payload as JWTPayload & { oid?: string }).oid || payload.sub || '',
        email: (payload as JWTPayload & { preferred_username?: string }).preferred_username || '',
        displayName: (payload as JWTPayload & { name?: string }).name || '',
        roles: ((payload as JWTPayload & { roles?: string[] }).roles) || [],
      };
    } catch (err) {
      logger.debug({ err }, 'JWT validation failed');
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export default fp(authPlugin, {
  name: 'auth',
});
