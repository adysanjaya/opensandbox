import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { endpoints, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { nanoid } from 'nanoid';
import type { User } from '../db/schema.js';

const app = new Hono<{
  Variables: { user: User };
}>();

app.use('*', authMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-_]+$/i),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  flow: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-_]+$/i).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  groupId: z.string().nullable().optional(),
  flow: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }).optional(),
  isActive: z.boolean().optional(),
});

app.get('/', async (c) => {
  const user = c.get('user');
  const list = await db.query.endpoints.findMany({
    where: eq(endpoints.userId, user.id),
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  return c.json({
    success: true,
    data: list.map((e) => ({
      ...e,
      flow: JSON.parse(e.flowJson),
      flowJson: undefined,
    })),
  });
});

app.post('/', zValidator('json', createSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  // Check slug uniqueness for this user
  const existing = await db.query.endpoints.findFirst({
    where: and(eq(endpoints.userId, user.id), eq(endpoints.slug, body.slug)),
  });

  if (existing) {
    return c.json({ success: false, error: 'Slug already exists' }, 409);
  }

  const id = nanoid();
  await db.insert(endpoints).values({
    id,
    userId: user.id,
    name: body.name,
    slug: body.slug,
    method: body.method,
    flowJson: JSON.stringify(body.flow),
  });

  return c.json({
    success: true,
    data: {
      id,
      userId: user.id,
      name: body.name,
      slug: body.slug,
      method: body.method,
      flow: body.flow,
      userHash: user.userHash,
      url: `/${user.userHash}/${body.slug}`,
    },
  });
});

app.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const endpoint = await db.query.endpoints.findFirst({
    where: and(eq(endpoints.id, id), eq(endpoints.userId, user.id)),
  });

  if (!endpoint) {
    return c.json({ success: false, error: 'Endpoint not found' }, 404);
  }

  return c.json({
    success: true,
    data: {
      ...endpoint,
      flow: JSON.parse(endpoint.flowJson),
      flowJson: undefined,
      userHash: user.userHash,
      url: `/${user.userHash}/${endpoint.slug}`,
    },
  });
});

app.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const endpoint = await db.query.endpoints.findFirst({
    where: and(eq(endpoints.id, id), eq(endpoints.userId, user.id)),
  });

  if (!endpoint) {
    return c.json({ success: false, error: 'Endpoint not found' }, 404);
  }

  if (body.slug && body.slug !== endpoint.slug) {
    const existing = await db.query.endpoints.findFirst({
      where: and(eq(endpoints.userId, user.id), eq(endpoints.slug, body.slug)),
    });
    if (existing) {
      return c.json({ success: false, error: 'Slug already exists' }, 409);
    }
  }

  await db
    .update(endpoints)
    .set({
      name: body.name ?? endpoint.name,
      slug: body.slug ?? endpoint.slug,
      method: body.method ?? endpoint.method,
      groupId: body.groupId !== undefined ? body.groupId : endpoint.groupId,
      flowJson: body.flow ? JSON.stringify(body.flow) : endpoint.flowJson,
      isActive: body.isActive ?? endpoint.isActive,
      updatedAt: new Date(),
    })
    .where(eq(endpoints.id, id));

  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const endpoint = await db.query.endpoints.findFirst({
    where: and(eq(endpoints.id, id), eq(endpoints.userId, user.id)),
  });

  if (!endpoint) {
    return c.json({ success: false, error: 'Endpoint not found' }, 404);
  }

  await db.delete(endpoints).where(eq(endpoints.id, id));
  return c.json({ success: true });
});

app.post('/:id/duplicate', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const endpoint = await db.query.endpoints.findFirst({
    where: and(eq(endpoints.id, id), eq(endpoints.userId, user.id)),
  });

  if (!endpoint) {
    return c.json({ success: false, error: 'Endpoint not found' }, 404);
  }

  // Generate unique slug
  const baseSlug = endpoint.slug + '-copy';
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.query.endpoints.findFirst({
      where: and(eq(endpoints.userId, user.id), eq(endpoints.slug, slug)),
    });
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const newId = nanoid();
  await db.insert(endpoints).values({
    id: newId,
    userId: user.id,
    name: endpoint.name + ' (Copy)',
    slug,
    method: endpoint.method,
    flowJson: endpoint.flowJson,
    isActive: endpoint.isActive,
  });

  return c.json({
    success: true,
    data: {
      id: newId,
      userId: user.id,
      name: endpoint.name + ' (Copy)',
      slug,
      method: endpoint.method,
      flow: JSON.parse(endpoint.flowJson),
      userHash: user.userHash,
      url: `/${user.userHash}/${slug}`,
    },
  });
});

export default app;
