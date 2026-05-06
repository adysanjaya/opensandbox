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

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return c.json({ success: false, error: 'Email already registered' }, 409);
  }

  const passwordHash = await hashPassword(password);
  const userId = nanoid();
  const apiKey = generateApiKey();
  const userHash = generateUserHash();

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    apiKey,
    userHash,
  });

  const token = await createToken({ userId, email, role: 'user' });

  return c.json({
    success: true,
    data: { token, user: { id: userId, email, name, apiKey, userHash } },
  });
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
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
      // User exists - link OAuth if not already linked
      if (!user.oauthProvider) {
        await db.update(users)
          .set({
            oauthProvider: 'google',
            oauthId: googleId,
            oauthPicture: picture || null,
          })
          .where(eq(users.id, user.id));
        user = { ...user, oauthProvider: 'google', oauthId: googleId, oauthPicture: picture || null };
      }
    } else {
      // Create new user
      const userId = nanoid();
      const apiKey = generateApiKey();
      const userHash = generateUserHash();

      const [newUser] = await db.insert(users).values({
        id: userId,
        email,
        name: googleName || email.split('@')[0],
        passwordHash: null,
        apiKey,
        userHash,
        oauthProvider: 'google',
        oauthId: googleId,
        oauthPicture: picture || null,
      }).returning();

      user = newUser;
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
    const body = c.req.valid('json');
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: body.code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000/login',
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
      if (!user.oauthProvider) {
        await db.update(users)
          .set({
            oauthProvider: 'google',
            oauthId: googleId,
            oauthPicture: picture || null,
          })
          .where(eq(users.id, user.id));
        user = { ...user, oauthProvider: 'google', oauthId: googleId, oauthPicture: picture || null };
      }
    } else {
      const userId = nanoid();
      const apiKey = generateApiKey();
      const userHash = generateUserHash();

      const [newUser] = await db.insert(users).values({
        id: userId,
        email,
        name: googleName || email.split('@')[0],
        passwordHash: null,
        apiKey,
        userHash,
        oauthProvider: 'google',
        oauthId: googleId,
        oauthPicture: picture || null,
      }).returning();

      user = newUser;
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
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
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
