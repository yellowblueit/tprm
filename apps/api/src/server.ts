import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { getEnv } from './config/env.js';
import { getLogger } from './utils/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import authPlugin from './plugins/auth.plugin.js';
import tenantPlugin from './plugins/tenant.plugin.js';
import rbacPlugin from './plugins/rbac.plugin.js';
import { disconnectPrisma } from './services/prisma.service.js';

// Route modules
import { tenantRoutes } from './modules/tenants/tenant.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { vendorRoutes } from './modules/vendors/vendor.routes.js';

async function buildServer() {
  const env = getEnv();
  const logger = getLogger();

  const app = Fastify({
    logger: false, // We use our own pino instance
    requestTimeout: 30000,
    bodyLimit: 52428800, // 50MB for file uploads
  });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Plugins
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, // Handled by Nginx in production
  });

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  await app.register(multipart, {
    limits: {
      fileSize: 52428800, // 50MB
      files: 5,
    },
  });

  // Auth & tenant plugins
  await app.register(authPlugin);
  await app.register(tenantPlugin);
  await app.register(rbacPlugin);

  // Health check (no auth)
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes (v1)
  await app.register(async function apiV1(api) {
    // Pre-handler: authenticate and resolve tenant for all v1 routes
    api.addHook('preHandler', async (request, reply) => {
      await app.authenticate(request, reply);
      await app.resolveTenant(request, reply);
    });

    await api.register(tenantRoutes, { prefix: '/tenants' });
    await api.register(userRoutes, { prefix: '/users' });
    await api.register(vendorRoutes, { prefix: '/vendors' });
  }, { prefix: '/api/v1' });

  return app;
}

async function start() {
  const env = getEnv();
  const logger = getLogger();

  try {
    const app = await buildServer();

    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    logger.info(`Server listening on ${env.API_HOST}:${env.API_PORT}`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        await app.close();
        await disconnectPrisma();
        process.exit(0);
      });
    }
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();

export { buildServer };
