# Multi-stage Bun Dockerfile for OpenSandbox Web Frontend
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Install dependencies based on lockfile
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/types ./packages/types
COPY tsconfig.json ./

# Build Next.js application
WORKDIR /app/apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_WEB_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL
ENV NODE_ENV=production

RUN bun run build

# Expose Web Port
EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "start"]
