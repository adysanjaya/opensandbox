import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { endpoints, users, apiLogs } from '../db/schema.js';
import { eq, and, gte, desc } from 'drizzle-orm';
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

// GET /api/endpoints/analytics - Sandbox API Hit Metrics for current user
app.get('/analytics', async (c) => {
  const user = c.get('user');
  const range = c.req.query('range') || '7d';

  let since: Date;
  let bucketCount: number;
  let isHourly = false;

  if (range === '24h') {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    bucketCount = 24;
    isHourly = true;
  } else if (range === '30d') {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    bucketCount = 30;
  } else {
    // default 7d
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    bucketCount = 7;
  }

  const logs = await db.query.apiLogs.findMany({
    where: and(eq(apiLogs.userId, user.id), gte(apiLogs.createdAt, since)),
    orderBy: [desc(apiLogs.createdAt)],
  });

  const userEndpoints = await db.query.endpoints.findMany({
    where: eq(endpoints.userId, user.id),
  });
  const endpointMap = new Map(userEndpoints.map((e) => [e.id, e]));

  const totalRequests = logs.length;
  const successRequests = logs.filter((l) => l.statusCode >= 200 && l.statusCode < 400).length;
  const errorRequests = totalRequests - successRequests;
  const successRate =
    totalRequests > 0 ? Number(((successRequests / totalRequests) * 100).toFixed(1)) : 100;
  const avgLatency =
    totalRequests > 0
      ? Math.round(logs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / totalRequests)
      : 0;

  // Build time-series buckets
  const now = new Date();
  const series: { label: string; date: string; hits: number; success: number; error: number }[] = [];

  if (isHourly) {
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours()}`;
      series.push({
        label: hourStr,
        date: dateKey,
        hits: 0,
        success: 0,
        error: 0,
      });
    }

    for (const log of logs) {
      const d = new Date(log.createdAt);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours()}`;
      const bucket = series.find((s) => s.date === dateKey);
      if (bucket) {
        bucket.hits++;
        if (log.statusCode >= 200 && log.statusCode < 400) {
          bucket.success++;
        } else {
          bucket.error++;
        }
      }
    }
  } else {
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dayNum = `${d.getDate()}/${d.getMonth() + 1}`;
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      series.push({
        label: range === '30d' ? dayNum : `${dayName} ${dayNum}`,
        date: dateKey,
        hits: 0,
        success: 0,
        error: 0,
      });
    }

    for (const log of logs) {
      const d = new Date(log.createdAt);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const bucket = series.find((s) => s.date === dateKey);
      if (bucket) {
        bucket.hits++;
        if (log.statusCode >= 200 && log.statusCode < 400) {
          bucket.success++;
        } else {
          bucket.error++;
        }
      }
    }
  }

  // Top endpoints by hit count
  const epCountMap: Record<string, { count: number; success: number; error: number }> = {};
  for (const log of logs) {
    if (!epCountMap[log.endpointId]) {
      epCountMap[log.endpointId] = { count: 0, success: 0, error: 0 };
    }
    epCountMap[log.endpointId].count++;
    if (log.statusCode >= 200 && log.statusCode < 400) {
      epCountMap[log.endpointId].success++;
    } else {
      epCountMap[log.endpointId].error++;
    }
  }

  const topEndpoints = Object.entries(epCountMap)
    .map(([id, stats]) => {
      const ep = endpointMap.get(id);
      return {
        id,
        name: ep?.name || 'Deleted Endpoint',
        slug: ep?.slug || 'unknown',
        method: ep?.method || 'GET',
        isActive: ep?.isActive ?? false,
        hits: stats.count,
        success: stats.success,
        error: stats.error,
      };
    })
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 5);

  return c.json({
    success: true,
    data: {
      range,
      summary: {
        totalRequests,
        successRequests,
        errorRequests,
        successRate,
        avgLatency,
      },
      series,
      topEndpoints,
    },
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
