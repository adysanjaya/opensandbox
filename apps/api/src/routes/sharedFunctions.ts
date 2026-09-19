import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { sharedFunctions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { nanoid } from 'nanoid';
import type { User } from '../db/schema.js';

const app = new Hono<{
  Variables: { user: User };
}>();

app.use('*', authMiddleware);

const flowSchema = z.object({
  nodes: z.array(z.record(z.any())),
  edges: z.array(z.record(z.any())),
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  flow: flowSchema,
});

app.get('/', async (c) => {
  const user = c.get('user');
  const list = await db.query.sharedFunctions.findMany({
    where: eq(sharedFunctions.userId, user.id),
    orderBy: (sf, { desc }) => [desc(sf.createdAt)],
  });
  return c.json({ success: true, data: list });
});

app.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const sf = await db.query.sharedFunctions.findFirst({
    where: and(eq(sharedFunctions.id, id), eq(sharedFunctions.userId, user.id)),
  });
  if (!sf) {
    return c.json({ success: false, error: 'Shared function not found' }, 404);
  }
  return c.json({ success: true, data: sf });
});

app.post('/', zValidator('json', createSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const id = nanoid();
  await db.insert(sharedFunctions).values({
    id,
    userId: user.id,
    name: body.name,
    description: body.description || null,
    flowJson: JSON.stringify(body.flow),
  });
  return c.json({
    success: true,
    data: {
      id,
      userId: user.id,
      name: body.name,
      description: body.description,
      flowJson: JSON.stringify(body.flow),
    },
  });
});

app.patch('/:id', zValidator('json', createSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const sf = await db.query.sharedFunctions.findFirst({
    where: and(eq(sharedFunctions.id, id), eq(sharedFunctions.userId, user.id)),
  });

  if (!sf) {
    return c.json({ success: false, error: 'Shared function not found' }, 404);
  }

  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description || null;
  if (body.flow !== undefined) updateData.flowJson = JSON.stringify(body.flow);
  updateData.updatedAt = new Date();

  await db.update(sharedFunctions).set(updateData).where(eq(sharedFunctions.id, id));
  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const sf = await db.query.sharedFunctions.findFirst({
    where: and(eq(sharedFunctions.id, id), eq(sharedFunctions.userId, user.id)),
  });

  if (!sf) {
    return c.json({ success: false, error: 'Shared function not found' }, 404);
  }

  await db.delete(sharedFunctions).where(eq(sharedFunctions.id, id));
  return c.json({ success: true });
});

export default app;
