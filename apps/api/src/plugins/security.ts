import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

export const securityPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // 1. Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // API returns JSON
  });

  // 2. CORS allowlist
  const allowedOrigins = config.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return cb(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true, // for admin cookie session
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'If-None-Match'],
  });

  // 3. Cookie plugin
  await fastify.register(cookie, {
    secret: config.SESSION_SECRET,
    hook: 'onRequest',
  });
});
