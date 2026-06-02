# Multi-stage build de la API NestJS (monorepo pnpm)
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @clientra/api db:generate
RUN pnpm --filter @clientra/api build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
