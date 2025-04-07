# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .

RUN ls -la
RUN corepack enable && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM deps AS workspace
WORKDIR /app
COPY . .

RUN corepack enable pnpm && pnpm recursive run build

RUN pnpm deploy --filter=mhm-97-remake  /prod/mhm-97-remake

FROM nginx

COPY --from=workspace /app/packages/mhm-97-remake/dist /usr/share/nginx/html