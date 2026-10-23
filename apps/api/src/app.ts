import fastify, { type FastifyInstance, type FastifyHttpOptions, type RawServerDefault } from 'fastify';
import type { Client } from '@libsql/client';
import type { AppDatabase } from './types.js';
import { db as defaultDb, client as defaultClient } from './db/client.js';
import { config } from './config.js';
import { securityPlugin } from './plugins/security.js';
import { rateLimitPlugin } from './plugins/rateLimit.js';
import { healthRoutes } from './routes/health.js';
import { listingRoutes } from './routes/listings.js';
import { reportRoutes } from './routes/reports.js';
import { submissionRoutes } from './routes/submissions.js';
import { adminRoutes } from './routes/admin.js';

export interface BuildAppOptions {
  db?: AppDatabase;
  dbClient?: Client;
  fastifyOptions?: FastifyHttpOptions<RawServerDefault>;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const isTest = config.NODE_ENV === 'test';

  const app = fastify({
    bodyLimit: 51200, // 50 kB strict body size limit
    logger: isTest
      ? false
      : {
          level: config.LOG_LEVEL,
          serializers: {
            req(req) {
              return {
                method: req.method,
                url: req.url,
              };
            },
            res(res) {
              return {
                statusCode: res.statusCode,
              };
            },
            err(err) {
              return {
                type: err.name || 'Error',
                message: err.message,
                stack: err.stack || '',
              };
            },
          },
        },
    ...options.fastifyOptions,
  });

  // Decorate with database instances
  app.decorate('db', options.db || defaultDb);
  if (options.dbClient || defaultClient) {
    app.decorate('dbClient', options.dbClient || defaultClient);
  }

  // Global plugins
  app.register(securityPlugin);
  app.register(rateLimitPlugin);

  // Custom Not Found handler
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'not_found',
        message: 'Route not found.',
      },
    });
  });

  // Global error handler
  app.setErrorHandler((error: any, request, reply) => {
    // CORS rejection
    if (error.message === 'Not allowed by CORS') {
      return reply.status(403).send({
        error: {
          code: 'forbidden',
          message: 'Not allowed by CORS.',
        },
      });
    }

    // Rate limit response
    if (error.statusCode === 429 || error.error?.code === 'rate_limited') {
      const errPayload = error.error || {
        code: 'rate_limited',
        message: error.message || 'Too many requests.',
      };
      return reply.status(429).send({
        error: errPayload,
      });
    }

    // Body limit exceeded
    if (error.statusCode === 413 || error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.status(413).send({
        error: {
          code: 'payload_too_large',
          message: 'Request payload exceeds 50 kB limit.',
        },
      });
    }

    // Handled validation or custom HTTP status errors
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code || 'client_error',
          message: error.message,
        },
      });
    }

    // 500 internal server error - never leak internal stack traces or database info
    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'internal_error',
        message: 'An internal server error occurred.',
      },
    });
  });

  // Mount root health check
  app.register(healthRoutes);

  // Mount versioned API routes under /api/v1
  app.register(
    async (v1) => {
      await v1.register(healthRoutes);
      await v1.register(listingRoutes);
      await v1.register(reportRoutes);
      await v1.register(submissionRoutes);
      await v1.register(adminRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
}
