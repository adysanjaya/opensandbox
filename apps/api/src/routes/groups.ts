import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { endpointGroups } from '../db/schema.js';
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
  color: z.string().min(1).default('#3b82f6'),
});

app.get('/', async (c) => {
  const user = c.get('user');
  const list = await db.query.endpointGroups.findMany({
    where: eq(endpointGroups.userId, user.id),
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  });
  return c.json({ success: true, data: list });
});

app.post('/', zValidator('json', createSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const id = nanoid();
  await db.insert(endpointGroups).values({
    id,
    userId: user.id,
    name: body.name,
    color: body.color,
  });
  return c.json({ success: true, data: { id, userId: user.id, name: body.name, color: body.color } });
});

app.patch('/:id', zValidator('json', createSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const group = await db.query.endpointGroups.findFirst({
    where: and(eq(endpointGroups.id, id), eq(endpointGroups.userId, user.id)),
  });

  if (!group) {
    return c.json({ success: false, error: 'Group not found' }, 404);
  }

  await db.update(endpointGroups).set({
    name: body.name ?? group.name,
    color: body.color ?? group.color,
  }).where(eq(endpointGroups.id, id));

  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const group = await db.query.endpointGroups.findFirst({
    where: and(eq(endpointGroups.id, id), eq(endpointGroups.userId, user.id)),
  });

  if (!group) {
    return c.json({ success: false, error: 'Group not found' }, 404);
  }

  await db.delete(endpointGroups).where(eq(endpointGroups.id, id));
  return c.json({ success: true });
});

export default app;
