import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sandbox';

// For migrations (single connection)
export const migrationClient = postgres(connectionString, { max: 1 });

// For queries (pooled connection)
export const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
