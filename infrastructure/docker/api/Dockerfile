# Multi-stage build de la API NestJS (monorepo pnpm)
FROM node:22-alpine AS builder
# Toolchain para compilar módulos nativos (bcrypt) si el binario pre-built de
# GitHub no está disponible (p.ej. 504). Sin esto, node-gyp falla por falta de Python.
# openssl: Prisma lo necesita para detectar la versión de libssl del engine.
RUN apk add --no-cache python3 make g++ openssl
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @clientra/shared-types build
RUN pnpm --filter @clientra/shared-utils build
RUN pnpm --filter @clientra/api db:generate
RUN pnpm --filter @clientra/api build

FROM node:22-alpine AS runner
RUN apk add --no-cache postgresql-client openssl
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
COPY infrastructure/docker/api/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh && chmod +x /entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/entrypoint.sh"]
