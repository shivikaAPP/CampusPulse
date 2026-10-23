import type { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { listPublicOpportunities, getPublicOpportunityById } from '../db/queries.js';

export const listingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /opportunities
  fastify.get('/opportunities', async (request, reply) => {
    const list = await listPublicOpportunities(fastify.db);
    const jsonStr = JSON.stringify(list);
    const etag = `"${crypto.createHash('md5').update(jsonStr).digest('hex')}"`;

    const clientEtag = request.headers['if-none-match'];
    if (clientEtag && clientEtag === etag) {
      return reply.status(304).send();
    }

    reply.header('ETag', etag);
    reply.header('Cache-Control', 'public, max-age=60');
    return reply.status(200).send(list);
  });

  // GET /opportunities/:id
  fastify.get<{ Params: { id: string } }>('/opportunities/:id', async (request, reply) => {
    const { id } = request.params;
    const opp = await getPublicOpportunityById(fastify.db, id);

    if (!opp) {
      return reply.status(404).send({
        error: {
          code: 'not_found',
          message: 'Opportunity not found.',
        },
      });
    }

    return reply.status(200).send(opp);
  });
};
