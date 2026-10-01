#!/usr/bin/env bash
# Stop this lesson's processes and remove generated files.
# Docker cleanup is limited to containers named for this lesson, then unused
# (dangling) Docker resources. Other running projects are left alone.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Stopping lesson processes..."
pkill -f "${ROOT}/scripts/serve-report.mjs" 2>/dev/null || true
pkill -f "${ROOT}/scripts/remote-cache-server.mjs" 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k 4100/tcp 2>/dev/null || true
  fuser -k 4280/tcp 2>/dev/null || true
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Stopping lesson containers (if any)..."
  ids="$(
    {
      docker ps -aq --filter name=lesson-01
      docker ps -aq --filter name=pulse-platform
    } 2>/dev/null | sort -u || true
  )"
  if [ -n "${ids}" ]; then
    # shellcheck disable=SC2086
    docker stop ${ids} || true
    # shellcheck disable=SC2086
    docker rm ${ids} || true
  else
    echo "No lesson containers found."
  fi

  echo "Removing unused Docker resources..."
  docker container prune -f || true
  docker image prune -f || true
  docker volume prune -f || true
  docker network prune -f || true
else
  echo "Docker daemon is not available from this shell; skipped container cleanup."
fi

echo "Removing generated files..."
find "$ROOT" -type d \( \
  -name node_modules -o \
  -name dist -o \
  -name .turbo -o \
  -name .next -o \
  -name coverage -o \
  -name .remote-cache -o \
  -name .cache -o \
  -name .vite -o \
  -name .parcel-cache \
\) -prune -exec rm -rf {} +

rm -rf "$ROOT/report/data"

find "$ROOT" -type f \( \
  -name .eslintcache -o \
  -name '*.tsbuildinfo' -o \
  -name 'npm-debug.log*' -o \
  -name 'pnpm-debug.log*' \
\) -delete

find "$ROOT" -type f \( \
  -name .env -o \
  -name .env.local -o \
  -name .env.development -o \
  -name .env.production -o \
  -name .env.test \
\) ! -name .env.example -print -delete

echo "Cleanup finished."
