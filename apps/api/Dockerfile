# Multi-stage Bun Dockerfile for OpenSandbox API
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Install dependencies based on lockfile
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY tsconfig.json ./

WORKDIR /app/apps/api

# Expose API Port
EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

# Run migrations and start API server
CMD ["sh", "-c", "bun run db:migrate && bun run src/index.ts"]
