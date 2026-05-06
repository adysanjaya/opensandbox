import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import authRoutes from './routes/auth.js';
import endpointRoutes from './routes/endpoints.js';
import groupRoutes from './routes/groups.js';
import sharedFunctionRoutes from './routes/sharedFunctions.js';
import executeRoutes from './routes/execute.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/endpoints', endpointRoutes);
app.route('/api/groups', groupRoutes);
app.route('/api/shared-functions', sharedFunctionRoutes);
app.route('/', executeRoutes); // Public execution at root

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404));

const port = Number(process.env.PORT) || 4000;
console.log(`🚀 Sandbox API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
