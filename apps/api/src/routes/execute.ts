import { Hono } from 'hono';
import { db } from '../db/index.js';
import { endpoints, users, sharedFunctions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { FlowEngine } from '../lib/flowEngine.js';

const app = new Hono();

// Public execution endpoint: /:userHash/:slug
app.all('/:userHash/:slug', async (c) => {
  const { userHash, slug } = c.req.param();

  // Find user by hash
  const user = await db.query.users.findFirst({
    where: eq(users.userHash, userHash),
  });

  if (!user) {
    return c.json({ error: 'Not found' }, 404);
  }

  // Find endpoint
  const endpoint = await db.query.endpoints.findFirst({
    where: and(
      eq(endpoints.userId, user.id),
      eq(endpoints.slug, slug)
    ),
  });

  if (!endpoint) {
    return c.json({ error: 'Endpoint not found' }, 404);
  }

  if (!endpoint.isActive) {
    return c.json({ error: 'Endpoint is inactive' }, 403);
  }

  // Check method
  if (endpoint.method !== c.req.method) {
    return c.json({ error: `Method not allowed. Expected ${endpoint.method}` }, 405);
  }

  // Parse request
  let body: any = null;
  const contentType = c.req.header('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json();
    } else {
      const text = await c.req.text();
      if (text) body = text;
    }
  } catch {
    body = null;
  }

  const query: Record<string, string> = {};
  const url = new URL(c.req.url);
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Build execution context
  const context = {
    endpointId: endpoint.id,
    request: {
      method: c.req.method,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
      query,
      body,
      path: `/${userHash}/${slug}`,
    },
    variables: {},
  };

  // Execute flow
  let flow: { nodes: any[]; edges: any[] };
  try {
    flow = JSON.parse(endpoint.flowJson);
  } catch {
    return c.json({ error: 'Invalid flow configuration' }, 500);
  }

  const engine = new FlowEngine(flow.nodes, flow.edges, {
    loadSharedFunction: async (id: string) => {
      const sf = await db.query.sharedFunctions.findFirst({
        where: and(eq(sharedFunctions.id, id), eq(sharedFunctions.userId, user.id)),
      });
      if (!sf) return null;
      try {
        return JSON.parse(sf.flowJson);
      } catch {
        return null;
      }
    },
  });
  const result = await engine.execute(context);

  // Set response headers
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      c.header(key, value);
    }
  }
  c.header('Content-Type', result.contentType);
  c.status(result.statusCode as any);

  return c.body(result.body);
});

export default app;
