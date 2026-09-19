import { Hono } from 'hono';
import { db } from '../db/index.js';
import { systemSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const app = new Hono();

export const DEFAULT_SUPPORT_SETTINGS = {
  whatsapp: '6281234567890',
  whatsappMessage: 'Halo Admin OpenSandbox, saya ingin menanyakan perihal layanan Sandbox API.',
  email: 'adysanjaya013@gmail.com',
  telegram: 'adysanjaya',
  documentationUrl: 'https://sandbox.adysanjaya.my.id',
  supportHours: 'Senin - Jumat: 09:00 - 18:00 WIB',
  welcomeMessage: 'Butuh bantuan atau panduan teknis seputar OpenSandbox? Kami siap membantu Anda!',
};

// GET /api/settings/support - Public endpoint for users to get contact channels
app.get('/support', async (c) => {
  try {
    const settingRow = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'support'),
    });

    let config = DEFAULT_SUPPORT_SETTINGS;
    if (settingRow?.value) {
      try {
        const parsed = JSON.parse(settingRow.value);
        config = { ...DEFAULT_SUPPORT_SETTINGS, ...parsed };
      } catch {
        config = DEFAULT_SUPPORT_SETTINGS;
      }
    }

    return c.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Failed to get support settings:', error);
    return c.json({
      success: true,
      data: DEFAULT_SUPPORT_SETTINGS,
    });
  }
});

// GET /api/settings/general - Public general settings
app.get('/general', async (c) => {
  try {
    const settingRow = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'general'),
    });

    const defaultConfig = {
      appName: 'OpenSandbox',
      allowRegistration: true,
      maintenanceMode: false,
    };

    let config = defaultConfig;
    if (settingRow?.value) {
      try {
        config = { ...defaultConfig, ...JSON.parse(settingRow.value) };
      } catch {
        config = defaultConfig;
      }
    }

    return c.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    return c.json({
      success: true,
      data: {
        appName: 'OpenSandbox',
        allowRegistration: true,
        maintenanceMode: false,
      },
    });
  }
});

export default app;
