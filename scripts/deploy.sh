#!/bin/sh
# Builds the site in Docker and makes it live for Caddy, run on the server from the checkout:
#   scripts/deploy.sh
# Each build goes to releases/<timestamp>; `current` is a symlink that is switched in one
# step, so visitors (and the service worker) never see a half-copied build. The three
# newest releases are kept for rollback: `ln -sfn releases/<older> current`.
set -eu
cd "$(dirname "$0")/.."

release="releases/$(date -u +%Y%m%dT%H%M%SZ)"
image=mhm-97-remake-build

docker build -f docker/build/Dockerfile -t "$image" .
container=$(docker create "$image")
trap 'docker rm "$container" >/dev/null' EXIT
mkdir -p releases
docker cp "$container:/app/dist" "$release"

ln -sfn "$release" current.next
mv -T current.next current
echo "live: $release"

ls -1d releases/*/ | head -n -3 | xargs -r rm -rf
