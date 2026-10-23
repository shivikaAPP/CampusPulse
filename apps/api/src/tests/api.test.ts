import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema.js';
import { ensureTables } from '../db/client.js';
import { buildApp } from '../app.js';
import { config } from '../config.js';
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_VALUE } from '../plugins/auth.js';
import { insertOpportunity } from '../db/queries.js';
import type { Opportunity } from '@campusplus/shared';

describe('CampusPlus API Integration Tests', () => {
  let app: ReturnType<typeof buildApp>;
  let testClient: ReturnType<typeof createClient>;
  let authCookie: string;

  const sampleOpportunity: Opportunity = {
    id: 'test-opp-001',
    title: 'Test Hackathon 2026',
    category: 'hackathon',
    organizer: 'Test Society',
    description: 'A test hackathon description.',
    benefits: ['Certificate', 'Prize pool'],
    fee: 0,
    additionalCostsNote: null,
    travelInfo: 'not_required',
    mode: 'online',
    city: null,
    skills: ['python', 'javascript'],
    topics: ['web-development'],
    level: 'beginner',
    eligibility: {
      minYear: null,
      maxYear: null,
      allowedColleges: null,
      manualChecks: [],
    },
    deadline: '2026-11-20T23:59:00+05:30',
    eventDate: '2026-11-22',
    applicationUrl: 'https://example.com/apply',
    sourceUrl: 'https://example.com/source',
    verification: 'verified',
    lastCheckedAt: '2026-10-24T12:00:00+05:30',
    isDemo: false,
    createdAt: '2026-10-24T10:00:00+05:30',
  };

  beforeAll(async () => {
    // Isolated in-memory database for testing
    testClient = createClient({ url: 'file::memory:' });
    await ensureTables(testClient);
    const testDb = drizzle(testClient, { schema });

    app = buildApp({
      db: testDb,
      dbClient: testClient,
    });

    // Populate one initial opportunity
    await insertOpportunity(testDb, sampleOpportunity);

    // Perform admin login to obtain authenticated session cookie
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { password: 'admin123' },
    });

    expect(loginRes.statusCode).toBe(200);
    const cookies = loginRes.cookies;
    const sessionCookie = cookies.find((c) => c.name === ADMIN_COOKIE_NAME);
    expect(sessionCookie).toBeDefined();
    authCookie = `${sessionCookie!.name}=${sessionCookie!.value}`;
  });

  afterAll(async () => {
    await app.close();
    testClient.close();
  });

  describe('Health Checks', () => {
    it('GET /health returns 200 and status ok', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok' });
    });

    it('GET /api/v1/health returns 200 and status ok', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok' });
    });
  });

  describe('Public Opportunities Endpoints', () => {
    it('GET /api/v1/opportunities returns listings with ETag and cache headers', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities',
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['etag']).toBeDefined();
      expect(res.headers['cache-control']).toBe('public, max-age=60');

      const items = res.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].id).toBe('test-opp-001');

      // Test 304 response on matching ETag
      const etag = res.headers['etag'] as string;
      const cachedRes = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities',
        headers: {
          'if-none-match': etag,
        },
      });
      expect(cachedRes.statusCode).toBe(304);
      expect(cachedRes.body).toBe('');
    });

    it('GET /api/v1/opportunities/:id returns 200 for valid ID and 404 for unknown', async () => {
      const foundRes = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities/test-opp-001',
      });
      expect(foundRes.statusCode).toBe(200);
      expect(foundRes.json().id).toBe('test-opp-001');

      const notFoundRes = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities/non-existent-id',
      });
      expect(notFoundRes.statusCode).toBe(404);
      expect(notFoundRes.json().error.code).toBe('not_found');
    });
  });

  describe('Public Reports Flow', () => {
    it('POST /api/v1/reports rejects invalid schema with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          opportunityId: 'test-opp-001',
          reason: 'invalid_reason_code',
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('validation_error');
    });

    it('POST /api/v1/reports returns 404 if opportunity does not exist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          opportunityId: 'unknown-opp-404',
          reason: 'expired',
        },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe('not_found');
    });

    it('POST /api/v1/reports accepts valid report with 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          opportunityId: 'test-opp-001',
          reason: 'wrong_details',
          details: 'The deadline was pushed back.',
          contactEmail: 'student@example.com',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ ok: true });
    });

    it('POST /api/v1/reports silently drops honeypot submission without writing to DB', async () => {
      // First count reports via admin
      const beforeRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports',
        headers: { cookie: authCookie },
      });
      const countBefore = beforeRes.json().length;

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          opportunityId: 'test-opp-001',
          reason: 'expired',
          website: 'http://spam-link.example.com', // Honeypot filled!
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ ok: true });

      // Verify no new report was inserted
      const afterRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports',
        headers: { cookie: authCookie },
      });
      expect(afterRes.json().length).toBe(countBefore);
    });
  });

  describe('Public Submissions Flow', () => {
    it('POST /api/v1/submissions rejects invalid schema with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submissions',
        payload: {
          title: 'Incomplete Submission',
          // missing category, organizer, description, etc.
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('validation_error');
    });

    it('POST /api/v1/submissions accepts valid submission with 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submissions',
        payload: {
          title: 'Campus Hackathon 2026',
          category: 'hackathon',
          organizer: 'Tech Club',
          description: 'An open hackathon for college coders.',
          fee: 0,
          mode: 'online',
          city: null,
          skills: ['python'],
          topics: ['ai-ml'],
          level: 'beginner',
          deadline: '2026-11-30T23:59:00+05:30',
          submitterEmail: 'organizer@club.edu',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ ok: true });
    });

    it('POST /api/v1/submissions silently drops honeypot submission without writing to DB', async () => {
      const beforeRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/submissions',
        headers: { cookie: authCookie },
      });
      const countBefore = beforeRes.json().length;

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submissions',
        payload: {
          title: 'Spam Opportunity',
          category: 'workshop',
          organizer: 'Spammer',
          description: 'Spam description',
          fee: 0,
          mode: 'online',
          city: null,
          skills: ['python'],
          topics: ['ai-ml'],
          level: 'beginner',
          deadline: '2026-11-30T23:59:00+05:30',
          website: 'http://spam-link.example.com', // Honeypot filled!
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ ok: true });

      const afterRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/submissions',
        headers: { cookie: authCookie },
      });
      expect(afterRes.json().length).toBe(countBefore);
    });
  });

  describe('Admin Auth & Session Security', () => {
    it('POST /api/v1/admin/login rejects incorrect password with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/login',
        payload: { password: 'wrongpassword' },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('invalid_credentials');
    });

    it('Protected admin routes require authentication cookie', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/opportunities',
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('unauthenticated');
    });

    it('Protected admin routes reject forged or invalid cookies', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/opportunities',
        headers: { cookie: `${ADMIN_COOKIE_NAME}=forged_session_token` },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('unauthenticated');
    });

    it('Mutating admin routes require X-Requested-With: campusplus header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/opportunities',
        headers: {
          cookie: authCookie,
          // Missing X-Requested-With!
        },
        payload: {
          title: 'Forbidden Post',
        },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('forbidden');
    });

    it('POST /api/v1/admin/logout clears admin cookie', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/logout',
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
      const clearedCookie = res.cookies.find((c) => c.name === ADMIN_COOKIE_NAME);
      expect(clearedCookie?.value).toBe('');
    });
  });

  describe('Admin Moderation Flows', () => {
    it('POST /api/v1/admin/opportunities strictly refuses verification="verified" without sourceUrl & lastCheckedAt', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/opportunities',
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
        payload: {
          id: 'unverified-attempt',
          title: 'Unverified Attempt',
          category: 'workshop',
          organizer: 'Workshop Org',
          description: 'A workshop description.',
          benefits: [],
          fee: 0,
          additionalCostsNote: null,
          travelInfo: 'not_required',
          mode: 'online',
          city: null,
          skills: ['python'],
          topics: ['ai-ml'],
          level: 'beginner',
          eligibility: { minYear: null, maxYear: null, allowedColleges: null, manualChecks: [] },
          deadline: '2026-11-20T23:59:00+05:30',
          eventDate: null,
          applicationUrl: null,
          sourceUrl: null, // missing sourceUrl!
          verification: 'verified', // claimed verified!
          lastCheckedAt: null, // missing lastCheckedAt!
          isDemo: false,
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('validation_error');
    });

    it('POST /api/v1/admin/opportunities rejects non-https URLs', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/opportunities',
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
        payload: {
          id: 'http-url-attempt',
          title: 'Insecure URL Attempt',
          category: 'workshop',
          organizer: 'Workshop Org',
          description: 'A workshop description.',
          benefits: [],
          fee: 0,
          additionalCostsNote: null,
          travelInfo: 'not_required',
          mode: 'online',
          city: null,
          skills: ['python'],
          topics: ['ai-ml'],
          level: 'beginner',
          eligibility: { minYear: null, maxYear: null, allowedColleges: null, manualChecks: [] },
          deadline: '2026-11-20T23:59:00+05:30',
          eventDate: null,
          applicationUrl: 'http://insecure-link.com', // NOT https!
          sourceUrl: null,
          verification: 'unverified',
          lastCheckedAt: null,
          isDemo: false,
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('validation_error');
    });

    it('POST /api/v1/admin/opportunities creates opportunity when valid', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/opportunities',
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
        payload: {
          id: 'admin-created-001',
          title: 'Admin Created Workshop',
          category: 'workshop',
          organizer: 'Tech Org',
          description: 'Valid workshop description.',
          benefits: ['Certificate'],
          fee: 100,
          additionalCostsNote: null,
          travelInfo: 'not_required',
          mode: 'online',
          city: null,
          skills: ['cloud'],
          topics: ['cloud'],
          level: 'intermediate',
          eligibility: { minYear: null, maxYear: null, allowedColleges: null, manualChecks: [] },
          deadline: '2026-11-20T23:59:00+05:30',
          eventDate: null,
          applicationUrl: 'https://valid-link.com/apply',
          sourceUrl: 'https://valid-link.com/source',
          verification: 'verified',
          lastCheckedAt: '2026-10-24T12:00:00+05:30',
          isDemo: false,
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().id).toBe('admin-created-001');
    });

    it('PATCH /api/v1/admin/opportunities/:id updates opportunity fields', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/admin/opportunities/admin-created-001',
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
        payload: {
          fee: 150,
          description: 'Updated workshop description.',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().fee).toBe(150);
      expect(res.json().description).toBe('Updated workshop description.');
    });

    it('DELETE /api/v1/admin/opportunities/:id soft deletes and hides from public list', async () => {
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: '/api/v1/admin/opportunities/admin-created-001',
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
      });
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.json()).toEqual({ ok: true });

      // Ensure public GET /opportunities no longer includes this opportunity
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities',
      });
      const ids = listRes.json().map((o: Opportunity) => o.id);
      expect(ids.includes('admin-created-001')).toBe(false);
    });

    it('Admin can review reports and update status', async () => {
      const reportsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports',
        headers: { cookie: authCookie },
      });
      expect(reportsRes.statusCode).toBe(200);
      const reports = reportsRes.json();
      expect(reports.length).toBeGreaterThan(0);

      const targetId = reports[0].id;
      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${targetId}`,
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
        payload: { status: 'reviewed' },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.json()).toEqual({ ok: true });
    });

    it('Admin can approve submission and convert it to community opportunity', async () => {
      const submissionsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/submissions',
        headers: { cookie: authCookie },
      });
      expect(submissionsRes.statusCode).toBe(200);
      const submissions = submissionsRes.json();
      expect(submissions.length).toBeGreaterThan(0);

      const pendingSub = submissions.find((s: { status: string }) => s.status === 'pending');
      expect(pendingSub).toBeDefined();

      const approveRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/submissions/${pendingSub.id}/approve`,
        headers: {
          cookie: authCookie,
          'x-requested-with': 'campusplus',
        },
      });

      expect(approveRes.statusCode).toBe(200);
      expect(approveRes.json().ok).toBe(true);
      const newOppId = approveRes.json().opportunityId;

      // Verify the new opportunity is listed publicly with verification="community"
      const oppRes = await app.inject({
        method: 'GET',
        url: `/api/v1/opportunities/${newOppId}`,
      });
      expect(oppRes.statusCode).toBe(200);
      expect(oppRes.json().verification).toBe('community');
      expect(oppRes.json().isDemo).toBe(false);
    });
  });

  describe('Security & Edge Cases', () => {
    it('CORS rejects unknown origin with 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities',
        headers: {
          origin: 'http://malicious-attacker.com',
        },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('forbidden');
    });

    it('CORS allows whitelisted origin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/opportunities',
        headers: {
          origin: 'http://localhost:5173',
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('Payloads exceeding 50 kB are rejected with 413', async () => {
      const hugeString = 'a'.repeat(60 * 1024); // 60 kB
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        payload: {
          opportunityId: 'test-opp-001',
          reason: 'other',
          details: hugeString,
        },
      });
      expect(res.statusCode).toBe(413);
      expect(res.json().error.code).toBe('payload_too_large');
    });

    it('Rate limiting triggers 429 after threshold is exceeded on sensitive routes', async () => {
      let lastRes;
      for (let i = 0; i < 6; i++) {
        lastRes = await app.inject({
          method: 'POST',
          url: '/api/v1/submissions',
          payload: {
            title: `Submission Rate Test ${i}`,
            category: 'workshop',
            organizer: 'Club',
            description: 'Rate test description',
            fee: 0,
            mode: 'online',
            city: null,
            skills: ['python'],
            topics: ['ai-ml'],
            level: 'beginner',
            deadline: '2026-11-30T23:59:00+05:30',
          },
        });
      }
      expect(lastRes?.statusCode).toBe(429);
      expect(lastRes?.json().error.code).toBe('rate_limited');
    });
  });
});
