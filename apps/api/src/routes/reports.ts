import type { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { ReportInputSchema } from '@campusplus/shared';
import { getPublicOpportunityById, insertReport } from '../db/queries.js';

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/reports', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const parseResult = ReportInputSchema.safeParse(request.body);
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
          message: 'Invalid report payload.',
          fields,
        },
      });
    }

    const { opportunityId, reason, details, contactEmail, website } = parseResult.data;

    // Honeypot check: If the hidden 'website' field is populated, silently drop write and return 201
    if (website && website.trim().length > 0) {
      return reply.status(201).send({ ok: true });
    }

    // Verify opportunity exists and is not soft-deleted
    const opp = await getPublicOpportunityById(fastify.db, opportunityId);
    if (!opp) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Opportunity not found.',
        },
      });
    }

    const reportId = `rep-${crypto.randomUUID()}`;
    await insertReport(fastify.db, {
      id: reportId,
      opportunityId,
      reason,
      details,
      contactEmail,
    });

    return reply.status(201).send({ ok: true });
  });
};
