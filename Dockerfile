# syntax=docker/dockerfile:1.7

# Stage 1 — deps + build
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN yarn prisma:generate

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# Stage 2 — runtime (incluye prisma CLI para migrate deploy al startup)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma        ./prisma
COPY prisma.config.ts ./

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma:deploy && node dist/index.mjs"]
