import type { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

export const ADMIN_COOKIE_NAME = 'cp_admin_session';
export const ADMIN_SESSION_VALUE = 'admin_authenticated';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, config.ADMIN_PASSWORD_HASH);
}

export async function requireAdminAuth(request: FastifyRequest, reply: FastifyReply) {
  const rawCookie = request.cookies[ADMIN_COOKIE_NAME];
  if (!rawCookie) {
    return reply.status(401).send({
      error: {
        code: 'unauthenticated',
        message: 'Admin authentication required.',
      },
    });
  }

  const unsigned = request.unsignCookie(rawCookie);
  if (!unsigned.valid || unsigned.value !== ADMIN_SESSION_VALUE) {
    return reply.status(401).send({
      error: {
        code: 'unauthenticated',
        message: 'Invalid or expired admin session.',
      },
    });
  }

  // Mutating requests must send X-Requested-With: campusplus header
  const isMutating = ['POST', 'PATCH', 'DELETE'].includes(request.method);
  if (isMutating) {
    const requestedWith = request.headers['x-requested-with'];
    if (requestedWith !== 'campusplus') {
      return reply.status(403).send({
        error: {
          code: 'forbidden',
          message: 'Mutating requests require X-Requested-With: campusplus header.',
        },
      });
    }
  }
}
