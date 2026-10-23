import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyPluginAsync } from 'fastify';

export const rateLimitPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: {
        code: 'rate_limited',
        message: `Too many requests. Please try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      },
    }),
  });
});
