# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY . .

RUN ls -la
RUN npm -g i pnpm

# Rebuild the source code only when needed
FROM deps AS workspace
WORKDIR /app
COPY . .

RUN pnpm i
RUN pnpm run build

FROM nginx

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=workspace /app/dist /usr/share/nginx/html
