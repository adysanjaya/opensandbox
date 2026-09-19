import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { users, endpointGroups, endpoints, systemSettings } from './schema.js';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sandbox';

async function seed() {
  console.log('🌱 Starting database seeding...');
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    const adminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    let adminUserId: string;

    if (!existingUser) {
      console.log(`👤 Creating default admin user (${adminEmail})...`);
      const passwordHash = await bcrypt.hash('admin123', 10);
      const newUserId = nanoid();
      
      await db.insert(users).values({
        id: newUserId,
        email: adminEmail,
        name: 'OpenSandbox Admin',
        passwordHash,
        role: 'admin',
        apiKey: `sk_live_${nanoid(24)}`,
        userHash: nanoid(8),
      });

      adminUserId = newUserId;
      console.log('✅ Admin user created. Email:', adminEmail, '| Password: admin123');
    } else {
      console.log(`ℹ️ Admin user (${adminEmail}) already exists.`);
      adminUserId = existingUser.id;
    }

    // Seed default Endpoint Group
    const existingGroups = await db
      .select()
      .from(endpointGroups)
      .where(eq(endpointGroups.userId, adminUserId))
      .limit(1);

    let defaultGroupId: string | null = null;
    if (existingGroups.length === 0) {
      console.log('📁 Creating starter endpoint group...');
      const groupId = nanoid();
      await db.insert(endpointGroups).values({
        id: groupId,
        userId: adminUserId,
        name: 'Starter APIs',
        color: '#6366f1',
      });
      defaultGroupId = groupId;
    } else {
      defaultGroupId = existingGroups[0].id;
    }

    // Seed starter Demo Endpoint
    const existingEndpoints = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.userId, adminUserId))
      .limit(1);

    if (existingEndpoints.length === 0) {
      console.log('⚡ Creating starter demo endpoint (/hello)...');
      const starterFlow = {
        nodes: [
          {
            id: 'node-trigger-1',
            type: 'trigger',
            position: { x: 250, y: 100 },
            data: {
              label: 'HTTP GET Trigger',
              method: 'GET',
            },
          },
          {
            id: 'node-set-var-1',
            type: 'setVariable',
            position: { x: 250, y: 240 },
            data: {
              label: 'Set Greetings',
              variableName: 'message',
              variableValue: 'Welcome to OpenSandbox API Flow Builder!',
            },
          },
          {
            id: 'node-response-1',
            type: 'response',
            position: { x: 250, y: 400 },
            data: {
              label: 'Return JSON Response',
              statusCode: 200,
              responseType: 'json',
              responseBody: JSON.stringify(
                {
                  status: 'success',
                  greeting: '{{variables.message}}',
                  documentation: 'https://sandbox.adysanjaya.my.id/docs',
                  poweredBy: 'OpenSandbox Engine',
                },
                null,
                2
              ),
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-trigger-1',
            target: 'node-set-var-1',
            sourceHandle: 'output',
            targetHandle: 'input',
          },
          {
            id: 'edge-2',
            source: 'node-set-var-1',
            target: 'node-response-1',
            sourceHandle: 'output',
            targetHandle: 'input',
          },
        ],
      };

      await db.insert(endpoints).values({
        id: nanoid(),
        userId: adminUserId,
        groupId: defaultGroupId,
        name: 'Hello World Flow',
        slug: 'hello',
        method: 'GET',
        flowJson: JSON.stringify(starterFlow),
        isActive: true,
      });
      console.log('✅ Starter endpoint created: GET /hello');
    }

    // Seed default System Settings
    const [existingSetting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'support_info'))
      .limit(1);

    if (!existingSetting) {
      console.log('⚙️ Initializing default support settings...');
      const defaultSupport = {
        email: adminEmail,
        telegram: '@adysanjaya',
        whatsapp: '+6281234567890',
        docsUrl: 'https://sandbox.adysanjaya.my.id/docs',
      };

      await db.insert(systemSettings).values({
        key: 'support_info',
        value: JSON.stringify(defaultSupport),
        updatedBy: adminUserId,
      });
      console.log('✅ Default support settings saved.');
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
