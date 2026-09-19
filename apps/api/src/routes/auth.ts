import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  createToken,
  generateApiKey,
  generateUserHash,
} from '../lib/auth.js';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';

const app = new Hono();

// Google OAuth Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleCredentialSchema = z.object({
  credential: z.string(),
});

const googleCodeSchema = z.object({
  code: z.string(),
});

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const superadmin = (process.env.SUPERADMIN_EMAIL || 'adysanjaya013@gmail.com').toLowerCase().trim();
  return email.toLowerCase().trim() === superadmin;
}

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return c.json({ success: false, error: 'Email already registered' }, 409);
  }

  const role = isSuperAdminEmail(email) ? 'admin' : 'user';
  const passwordHash = await hashPassword(password);
  const userId = nanoid();
  const apiKey = generateApiKey();
  const userHash = generateUserHash();

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    role,
    apiKey,
    userHash,
  });

  const token = await createToken({ userId, email, role });

  return c.json({
    success: true,
    data: { token, user: { id: userId, email, name, role, apiKey, userHash } },
  });
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  if (isSuperAdminEmail(user.email) && user.role !== 'admin') {
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
    user = { ...user, role: 'admin' };
  }

  const token = await createToken({ userId: user.id, email: user.email, role: user.role });

  return c.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        apiKey: user.apiKey,
        userHash: user.userHash,
      },
    },
  });
});

// Google OAuth Login/Register (ID Token flow)
app.post('/google', zValidator('json', googleCredentialSchema), async (c) => {
  try {
    const body = c.req.valid('json');

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: body.credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return c.json({ success: false, error: 'Failed to verify Google credentials' }, 400);
    }

    const { email, name: googleName, sub: googleId, picture } = payload;

    if (!email) {
      return c.json({ success: false, error: 'Google account does not have an email address' }, 400);
    }

    // Check if user exists
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user) {
      // User exists - link OAuth if not already linked and ensure superadmin role
      const shouldBeAdmin = isSuperAdminEmail(user.email);
      const updates: any = {};
      if (!user.oauthProvider) {
        updates.oauthProvider = 'google';
        updates.oauthId = googleId;
        updates.oauthPicture = picture || null;
      }
      if (shouldBeAdmin && user.role !== 'admin') {
        updates.role = 'admin';
      }
      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, user.id));
        user = { ...user, ...updates };
      }
    } else {
      // Create new user
      const userId = nanoid();
      const apiKey = generateApiKey();
      const userHash = generateUserHash();
      const role = isSuperAdminEmail(email) ? 'admin' : 'user';

      const [newUser] = await db.insert(users).values({
        id: userId,
        email,
        name: googleName || email.split('@')[0],
        passwordHash: null,
        role,
        apiKey,
        userHash,
        oauthProvider: 'google',
        oauthId: googleId,
        oauthPicture: picture || null,
      }).returning();

      user = newUser;
    }

    if (!user) {
      return c.json({ success: false, error: 'Failed to find or create user' }, 500);
    }

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          apiKey: user.apiKey,
          userHash: user.userHash,
          oauthPicture: user.oauthPicture,
        },
      },
    });
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return c.json({ success: false, error: error.message || 'Failed to authenticate with Google' }, 400);
  }
});

// Google OAuth Login/Register (Authorization Code flow)
app.post('/google/code', zValidator('json', googleCodeSchema), async (c) => {
  try {
    const { code } = c.req.valid('json');

    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.WEB_URL || 'http://localhost:3000'}/login`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      return c.json({ success: false, error: tokenData.error_description || 'Failed to exchange code' }, 400);
    }

    // Verify ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return c.json({ success: false, error: 'Failed to verify Google credentials' }, 400);
    }

    const { email, name: googleName, sub: googleId, picture } = payload;

    if (!email) {
      return c.json({ success: false, error: 'Google account does not have an email address' }, 400);
    }

    // Check if user exists
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user) {
      const shouldBeAdmin = isSuperAdminEmail(user.email);
      const updates: any = {};
      if (!user.oauthProvider) {
        updates.oauthProvider = 'google';
        updates.oauthId = googleId;
        updates.oauthPicture = picture || null;
      }
      if (shouldBeAdmin && user.role !== 'admin') {
        updates.role = 'admin';
      }
      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, user.id));
        user = { ...user, ...updates };
      }
    } else {
      const userId = nanoid();
      const apiKey = generateApiKey();
      const userHash = generateUserHash();
      const role = isSuperAdminEmail(email) ? 'admin' : 'user';

      const [newUser] = await db.insert(users).values({
        id: userId,
        email,
        name: googleName || email.split('@')[0],
        passwordHash: null,
        role,
        apiKey,
        userHash,
        oauthProvider: 'google',
        oauthId: googleId,
        oauthPicture: picture || null,
      }).returning();

      user = newUser;
    }

    if (!user) {
      return c.json({ success: false, error: 'Failed to find or create user' }, 500);
    }

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          apiKey: user.apiKey,
          userHash: user.userHash,
          oauthPicture: user.oauthPicture,
        },
      },
    });
  } catch (error: any) {
    console.error('Google OAuth code flow error:', error);
    return c.json({ success: false, error: error.message || 'Failed to authenticate with Google' }, 400);
  }
});

// Get Google config
app.get('/google/config', async (c) => {
  return c.json({
    clientId: GOOGLE_CLIENT_ID,
    enabled: !!GOOGLE_CLIENT_ID,
  });
});

app.get('/me', async (c) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { verifyToken } = await import('../lib/auth.js');
  try {
    const payload = await verifyToken(token);
    let user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    if (isSuperAdminEmail(user.email) && user.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      user = { ...user, role: 'admin' };
    }

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        apiKey: user.apiKey,
        userHash: user.userHash,
        oauthPicture: user.oauthPicture,
      },
    });
  } catch {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
});

export default app;
