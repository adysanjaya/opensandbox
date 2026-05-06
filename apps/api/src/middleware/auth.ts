import { createMiddleware } from 'hono/factory';
import { verifyToken } from '../lib/auth.js';
import type { User } from '../db/schema.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

type Env = {
  Variables: {
    user: User;
  };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : c.req.query('token');

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized: no token provided' });
  }

  try {
    const payload = await verifyToken(token);
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized: user not found' });
    }

    c.set('user', user);
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Unauthorized: invalid token' });
  }
});

export const optionalAuthMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (token) {
    try {
      const payload = await verifyToken(token);
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });
      if (user) c.set('user', user);
    } catch {
      // ignore
    }
  }

  await next();
});

export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    throw new HTTPException(403, { message: 'Forbidden: admin access required' });
  }
  await next();
});
