#!/usr/bin/env bash
# Stop lesson services and remove local + unused Docker resources.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> Stopping lesson Node services (ports 4100/4200, serve.mjs)"
for port in 4100 4200; do
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${pids:-}" ]]; then
      echo "    killing listeners on :$port -> $pids"
      # shellcheck disable=SC2086
      kill $pids 2>/dev/null || true
    fi
  fi
done
pkill -f "${ROOT}/apps/control-tower/server/serve.mjs" 2>/dev/null || true
pkill -f "apps/control-tower/server/serve.mjs" 2>/dev/null || true

echo "==> Stopping Docker Compose in this lesson (if any)"
if command -v docker >/dev/null 2>&1; then
  if [[ -f docker-compose.yml || -f docker-compose.yaml || -f compose.yml || -f compose.yaml ]]; then
    docker compose down --remove-orphans --volumes 2>/dev/null || true
  else
    echo "    no compose file in lesson directory"
  fi

  # Stop/remove containers explicitly named for this lesson (if any)
  lesson_containers="$(
    {
      docker ps -aq --filter "name=lesson-04" 2>/dev/null || true
      docker ps -aq --filter "name=pulse-lesson-04" 2>/dev/null || true
    } | sort -u | tr '\n' ' '
  )"
  if [[ -n "${lesson_containers// /}" ]]; then
    echo "    removing lesson-named containers: $lesson_containers"
    # shellcheck disable=SC2086
    docker rm -f $lesson_containers 2>/dev/null || true
  fi

  echo "==> Removing unused Docker resources (containers, images, volumes, networks)"
  docker container prune -f 2>/dev/null || true
  docker image prune -af 2>/dev/null || true
  docker volume prune -f 2>/dev/null || true
  docker network prune -f 2>/dev/null || true
  docker builder prune -af 2>/dev/null || true
else
  echo "    docker not installed; skipping"
fi

echo "==> Removing generated / cache files under lesson tree"
# Match artifact dirs only; -prune avoids descending into them
while IFS= read -r -d '' dir; do
  echo "    rm -rf $dir"
  rm -rf "$dir"
done < <(find "$ROOT" -type d \( \
  -name node_modules -o \
  -name .turbo -o \
  -name dist -o \
  -name build -o \
  -name coverage -o \
  -name .next -o \
  -name .cache -o \
  -name .vite -o \
  -name .vitest -o \
  -name test-results -o \
  -name playwright-report -o \
  -name .playwright \
\) -prune -print0 2>/dev/null)

# Cache / log files (skip anything still under node_modules if present)
while IFS= read -r -d '' file; do
  echo "    rm -f $file"
  rm -f "$file"
done < <(find "$ROOT" \
  \( -type d -name node_modules -prune \) -o \
  \( -type f \( \
    -name '*.tsbuildinfo' -o \
    -name .eslintcache -o \
    -name 'pnpm-debug.log*' -o \
    -name 'npm-debug.log*' -o \
    -name 'yarn-error.log*' -o \
    -name '.DS_Store' \
  \) -print0 \) 2>/dev/null)

echo "==> Removing unnecessary .env / credential files (keeping .env.example)"
while IFS= read -r -d '' envfile; do
  base="$(basename "$envfile")"
  if [[ "$base" == ".env.example" ]]; then
    continue
  fi
  echo "    rm -f $envfile"
  rm -f "$envfile"
done < <(find "$ROOT" \
  \( -type d -name node_modules -prune \) -o \
  \( -type f \( \
    -name '.env' -o \
    -name '.env.*' -o \
    -name '*.pem' -o \
    -name 'credentials.json' -o \
    -name 'service-account*.json' \
  \) ! -name '.env.example' -print0 \) 2>/dev/null)

echo "==> Cleanup complete"
echo "    Source and required lesson files were left intact."
echo "    Re-run with: pnpm install && pnpm build && pnpm dev"
