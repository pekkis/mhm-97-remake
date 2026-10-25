# Builds the static site; Caddy on the host serves the result (scripts/deploy.sh).
# Pinned by version and digest: upgrades happen when we decide (Dependabot proposes them).
FROM node:26.12.1-alpine3.24@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797
RUN apk add --no-cache brotli zstd
# The version in package.json's packageManager.
RUN npm -g i pnpm@12.15.0
WORKDIR /app
# Manifests first, so the dependency layer is cached until they change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
# Precompressed copies for Caddy's `file_server precompressed`: compressed once at build
# time at the highest levels, instead of on every request.
RUN find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \
      -o -name "*.json" -o -name "*.webmanifest" -o -name "*.txt" -o -name "*.ttf" \) \
      -exec gzip -k -9 {} \; -exec brotli -k -q 11 {} \; -exec zstd -q -19 {} \;
