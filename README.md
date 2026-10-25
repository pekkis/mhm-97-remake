# MHM 97 Remake

A remake of MHM 97, my first hockey manager simulation from ~1996-1997.

## Development

- Use pnpm 12: it runs this project on Node 26 by itself (`devEngines` in `package.json`)
- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`

## Build

- Create production build: `pnpm build`

## Type check

- Run TypeScript checks: `pnpm typecheck`

## Tests

- Run the vitest suite: `pnpm test --run`

## Verify

- Run lint, formatter (with fixes), typecheck, and tests in one go: `pnpm verify`

## Deploy

A static site: Caddy serves it straight from the server's checkout.

- `scripts/deploy.sh` builds the site in Docker (no Node needed on the server), copies it to
  `releases/<timestamp>` and switches the `current` symlink in one step. The three newest
  releases are kept; roll back with `ln -sfn releases/<older> current`.
- The build also writes precompressed `.zst`, `.br` and `.gz` copies, which Caddy serves
  with `file_server precompressed`.
