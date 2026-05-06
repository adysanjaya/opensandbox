import { pgTable, text, timestamp, boolean, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  apiKey: text('api_key').notNull().unique(),
  userHash: text('user_hash').notNull().unique(),
  oauthProvider: text('oauth_provider'),
  oauthId: text('oauth_id'),
  oauthPicture: text('oauth_picture'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const endpointGroups = pgTable('endpoint_groups', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const endpoints = pgTable('endpoints', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  groupId: text('group_id').references(() => endpointGroups.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  method: text('method', { enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] })
    .notNull()
    .default('GET'),
  flowJson: text('flow_json').notNull().default('{"nodes":[],"edges":[]}'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sharedFunctions = pgTable('shared_functions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  flowJson: text('flow_json').notNull().default('{"nodes":[],"edges":[]}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const migrations = pgTable('drizzle_migrations', {
  id: serial('id').primaryKey(),
  hash: text('hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type EndpointGroup = typeof endpointGroups.$inferSelect;
export type NewEndpointGroup = typeof endpointGroups.$inferInsert;
export type Endpoint = typeof endpoints.$inferSelect;
export type NewEndpoint = typeof endpoints.$inferInsert;
export type SharedFunction = typeof sharedFunctions.$inferSelect;
export type NewSharedFunction = typeof sharedFunctions.$inferInsert;
