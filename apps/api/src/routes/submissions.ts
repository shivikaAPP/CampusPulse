import type { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { SubmissionInputSchema } from '@campusplus/shared';
import { insertSubmission } from '../db/queries.js';

export const submissionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/submissions', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const parseResult = SubmissionInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      const fields: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path.join('.') || 'body';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid submission payload.',
          fields,
        },
      });
    }

    const { website, submitterEmail, ...opportunityData } = parseResult.data;

    // Honeypot check: silently accept without writing to database
    if (website && website.trim().length > 0) {
      return reply.status(201).send({ ok: true });
    }

    const submissionId = `sub-${crypto.randomUUID()}`;
    await insertSubmission(fastify.db, {
      id: submissionId,
      data: JSON.stringify(opportunityData),
      submitterEmail: submitterEmail || undefined,
    });

    return reply.status(201).send({ ok: true });
  });
};
