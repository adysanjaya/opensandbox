import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, endpoints, sharedFunctions, systemSettings } from '../db/schema.js';
import type { User } from '../db/schema.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { desc, eq, sql } from 'drizzle-orm';

const app = new Hono<{
  Variables: { user: User };
}>();


// Protect all admin routes
app.use('*', authMiddleware, adminMiddleware);

// Get all registered users with their endpoint and shared function counts
app.get('/users', async (c) => {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        oauthProvider: true,
        oauthPicture: true,
        createdAt: true,
      },
    });

    // Get endpoint counts per user
    const endpointCounts = await db
      .select({
        userId: endpoints.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(endpoints)
      .groupBy(endpoints.userId);

    const epCountMap = new Map<string, number>();
    for (const row of endpointCounts) {
      epCountMap.set(row.userId, Number(row.count) || 0);
    }

    // Get shared function counts per user
    const fnCounts = await db
      .select({
        userId: sharedFunctions.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(sharedFunctions)
      .groupBy(sharedFunctions.userId);

    const fnCountMap = new Map<string, number>();
    for (const row of fnCounts) {
      fnCountMap.set(row.userId, Number(row.count) || 0);
    }

    const usersWithStats = allUsers.map((u) => ({
      ...u,
      endpointsCount: epCountMap.get(u.id) || 0,
      sharedFunctionsCount: fnCountMap.get(u.id) || 0,
    }));

    return c.json({
      success: true,
      data: usersWithStats,
    });
  } catch (error: any) {
    console.error('Failed to fetch users for admin:', error);
    return c.json({ success: false, error: error.message || 'Failed to fetch users' }, 500);
  }
});

// Get admin dashboard stats
app.get('/stats', async (c) => {
  try {
    const [totalUsersRes] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [totalEndpointsRes] = await db.select({ count: sql<number>`count(*)::int` }).from(endpoints);
    const [activeEndpointsRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(endpoints)
      .where(eq(endpoints.isActive, true));
    const [totalFunctionsRes] = await db.select({ count: sql<number>`count(*)::int` }).from(sharedFunctions);

    const [googleUsersRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.oauthProvider, 'google'));

    const [recentUsersRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`);

    return c.json({
      success: true,
      data: {
        totalUsers: Number(totalUsersRes?.count) || 0,
        totalEndpoints: Number(totalEndpointsRes?.count) || 0,
        totalActiveEndpoints: Number(activeEndpointsRes?.count) || 0,
        totalSharedFunctions: Number(totalFunctionsRes?.count) || 0,
        googleUsers: Number(googleUsersRes?.count) || 0,
        newUsersLast7Days: Number(recentUsersRes?.count) || 0,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error);
    return c.json({ success: false, error: error.message || 'Failed to fetch stats' }, 500);
  }
});

// Get all system settings
app.get('/settings', async (c) => {
  try {
    const rows = await db.select().from(systemSettings);
    const settingsMap: Record<string, any> = {};
    for (const row of rows) {
      try {
        settingsMap[row.key] = JSON.parse(row.value);
      } catch {
        settingsMap[row.key] = row.value;
      }
    }
    return c.json({ success: true, data: settingsMap });
  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    return c.json({ success: false, error: error.message || 'Failed to fetch settings' }, 500);
  }
});

// Update or set a system setting
app.put('/settings/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const user = c.get('user');
    const body = await c.req.json();
    const valueStr = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);

    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    if (existing) {
      await db
        .update(systemSettings)
        .set({
          value: valueStr,
          updatedAt: new Date(),
          updatedBy: user?.id || null,
        })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({
        key,
        value: valueStr,
        updatedAt: new Date(),
        updatedBy: user?.id || null,
      });
    }

    return c.json({ success: true, message: `Setting ${key} updated successfully` });
  } catch (error: any) {
    console.error('Failed to update setting:', error);
    return c.json({ success: false, error: error.message || 'Failed to update setting' }, 500);
  }
});

export default app;

