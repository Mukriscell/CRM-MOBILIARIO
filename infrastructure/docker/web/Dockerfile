# Multi-stage build del frontend Next.js (monorepo pnpm)
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @clientra/web build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 3000
CMD ["pnpm", "--filter", "@clientra/web", "start"]
