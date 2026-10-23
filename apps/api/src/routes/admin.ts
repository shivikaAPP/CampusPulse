import type { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import {
  AdminLoginSchema,
  AdminUpdateReportSchema,
  CreateOpportunitySchema,
  UpdateOpportunitySchema,
  OpportunitySchema,
  type Opportunity,
} from '@campusplus/shared';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_VALUE,
  requireAdminAuth,
  verifyAdminPassword,
} from '../plugins/auth.js';
import {
  listOpportunitiesForAdmin,
  getOpportunityForAdmin,
  insertOpportunity,
  updateOpportunity,
  softDeleteOpportunity,
  listReportsForAdmin,
  updateReportStatus,
  listSubmissionsForAdmin,
  getSubmissionById,
  updateSubmissionStatus,
} from '../db/queries.js';
import { config } from '../config.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /admin/login
  fastify.post('/admin/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const parseResult = AdminLoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Password is required.',
        },
      });
    }

    const isValid = await verifyAdminPassword(parseResult.data.password);
    if (!isValid) {
      return reply.status(401).send({
        error: {
          code: 'invalid_credentials',
          message: 'Invalid admin credentials.',
        },
      });
    }

    reply.setCookie(ADMIN_COOKIE_NAME, ADMIN_SESSION_VALUE, {
      signed: true,
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return reply.status(200).send({ ok: true });
  });

  // POST /admin/logout
  fastify.post('/admin/logout', {
    preHandler: [requireAdminAuth],
  }, async (_request, reply) => {
    reply.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
    return reply.status(200).send({ ok: true });
  });

  // GET /admin/opportunities
  fastify.get('/admin/opportunities', {
    preHandler: [requireAdminAuth],
  }, async (_request, reply) => {
    const list = await listOpportunitiesForAdmin(fastify.db);
    return reply.status(200).send(list);
  });

  // POST /admin/opportunities
  fastify.post('/admin/opportunities', {
    preHandler: [requireAdminAuth],
  }, async (request, reply) => {
    const parseResult = CreateOpportunitySchema.safeParse(request.body);
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
          message: 'Invalid opportunity payload.',
          fields,
        },
      });
    }

    const now = new Date().toISOString();
    const candidateId = parseResult.data.id || `opp-${crypto.randomUUID().slice(0, 8)}`;
    const fullOpportunity: Opportunity = {
      ...parseResult.data,
      id: candidateId,
      createdAt: now,
    };

    // Full business and safety validation
    const fullValidation = OpportunitySchema.safeParse(fullOpportunity);
    if (!fullValidation.success) {
      const fields: Record<string, string> = {};
      for (const issue of fullValidation.error.issues) {
        const key = issue.path.join('.') || 'body';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Opportunity failed constraint validation.',
          fields,
        },
      });
    }

    await insertOpportunity(fastify.db, fullOpportunity);
    return reply.status(201).send(fullOpportunity);
  });

  // PATCH /admin/opportunities/:id
  fastify.patch<{ Params: { id: string } }>('/admin/opportunities/:id', {
    preHandler: [requireAdminAuth],
  }, async (request, reply) => {
    const { id } = request.params;
    const existing = await getOpportunityForAdmin(fastify.db, id);
    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Opportunity not found.',
        },
      });
    }

    const parseResult = UpdateOpportunitySchema.safeParse(request.body);
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
          message: 'Invalid opportunity update payload.',
          fields,
        },
      });
    }

    const patch = parseResult.data;

    // Build merged opportunity for invariant validation (strip database-only columns)
    const { updatedAt: _u, removedAt: _r, ...existingOpportunity } = existing;
    const merged: Opportunity = {
      ...existingOpportunity,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
    };

    const fullValidation = OpportunitySchema.safeParse(merged);
    if (!fullValidation.success) {
      const fields: Record<string, string> = {};
      for (const issue of fullValidation.error.issues) {
        const key = issue.path.join('.') || 'body';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Opportunity update violates constraints.',
          fields,
        },
      });
    }

    const updated = await updateOpportunity(fastify.db, id, patch);
    return reply.status(200).send(updated);
  });

  // DELETE /admin/opportunities/:id
  fastify.delete<{ Params: { id: string } }>('/admin/opportunities/:id', {
    preHandler: [requireAdminAuth],
  }, async (request, reply) => {
    const { id } = request.params;
    const existing = await getOpportunityForAdmin(fastify.db, id);
    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Opportunity not found.',
        },
      });
    }

    await softDeleteOpportunity(fastify.db, id);
    return reply.status(200).send({ ok: true });
  });

  // GET /admin/reports
  fastify.get('/admin/reports', {
    preHandler: [requireAdminAuth],
  }, async (_request, reply) => {
    const reports = await listReportsForAdmin(fastify.db);
    return reply.status(200).send(reports);
  });

  // PATCH /admin/reports/:id
  fastify.patch<{ Params: { id: string } }>('/admin/reports/:id', {
    preHandler: [requireAdminAuth],
  }, async (request, reply) => {
    const { id } = request.params;
    const parseResult = AdminUpdateReportSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid status. Must be "reviewed" or "dismissed".',
        },
      });
    }

    const ok = await updateReportStatus(fastify.db, id, parseResult.data.status);
    if (!ok) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Report not found.',
        },
      });
    }

    return reply.status(200).send({ ok: true });
  });

  // GET /admin/submissions
  fastify.get('/admin/submissions', {
    preHandler: [requireAdminAuth],
  }, async (_request, reply) => {
    const submissions = await listSubmissionsForAdmin(fastify.db);
    return reply.status(200).send(submissions);
  });

  // POST /admin/submissions/:id/approve
  fastify.post<{ Params: { id: string } }>('/admin/submissions/:id/approve', {
    preHandler: [requireAdminAuth],
  }, async (request, reply) => {
    const { id } = request.params;
    const sub = await getSubmissionById(fastify.db, id);
    if (!sub) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Submission not found.',
        },
      });
    }

    const data = JSON.parse(sub.data);
    const oppId = `opp-${id.replace(/^sub-/, '')}`;
    const now = new Date().toISOString();

    const newOpp: Opportunity = {
      id: oppId,
      title: data.title,
      category: data.category,
      organizer: data.organizer,
      description: data.description,
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      fee: data.fee,
      additionalCostsNote: data.additionalCostsNote ?? null,
      travelInfo: data.travelInfo ?? 'unknown',
      mode: data.mode,
      city: data.city ?? null,
      skills: Array.isArray(data.skills) ? data.skills : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      level: data.level,
      eligibility: data.eligibility ?? {
        minYear: null,
        maxYear: null,
        allowedColleges: null,
        manualChecks: [],
      },
      deadline: data.deadline,
      eventDate: data.eventDate ?? null,
      applicationUrl: data.applicationUrl ?? null,
      sourceUrl: data.sourceUrl ?? null,
      verification: 'community',
      lastCheckedAt: null,
      isDemo: false,
      createdAt: now,
    };

    const fullValidation = OpportunitySchema.safeParse(newOpp);
    if (!fullValidation.success) {
      const fields: Record<string, string> = {};
      for (const issue of fullValidation.error.issues) {
        const key = issue.path.join('.') || 'submission';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Cannot approve submission: fields do not satisfy opportunity constraints.',
          fields,
        },
      });
    }

    await insertOpportunity(fastify.db, newOpp);
    await updateSubmissionStatus(fastify.db, id, 'approved');

    return reply.status(200).send({
      ok: true,
      opportunityId: newOpp.id,
    });
  });

  // POST /admin/submissions/:id/reject
  fastify.post<{ Params: { id: string } }>('/admin/submissions/:id/reject', {
    preHandler: [requireAdminAuth],
  }, async (request, reply) => {
    const { id } = request.params;
    const sub = await getSubmissionById(fastify.db, id);
    if (!sub) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Submission not found.',
        },
      });
    }

    await updateSubmissionStatus(fastify.db, id, 'rejected');
    return reply.status(200).send({ ok: true });
  });
};
