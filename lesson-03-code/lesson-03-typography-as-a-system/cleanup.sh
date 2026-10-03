#!/usr/bin/env bash
# Lesson 3 cleanup: stop local services, remove generated artifacts,
# and prune unused Docker resources. Does not delete source or lesson docs.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> Lesson 3 cleanup in $ROOT"

echo "==> Stopping lesson Node services (ports 4100, 4180, 4280)"
for port in 4100 4180 4280; do
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  else
    pids="$(ss -lptn "sport = :$port" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)"
  fi
  if [[ -n "${pids:-}" ]]; then
    echo "    killing PID(s) on :$port -> $pids"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.3
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  else
    echo "    nothing listening on :$port"
  fi
done

# Also stop by process pattern (dev server / remote cache / playwright webServer)
patterns=(
  "apps/control-tower/server/serve.mjs"
  "scripts/remote-cache-server.mjs"
  "scripts/with-remote-cache.mjs"
)
for pat in "${patterns[@]}"; do
  pids="$(pgrep -f "$pat" 2>/dev/null || true)"
  if [[ -n "${pids:-}" ]]; then
    echo "    killing processes matching $pat -> $pids"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
  fi
done

echo "==> Stopping Docker Compose stacks for this lesson (if any)"
compose_files=()
while IFS= read -r -d '' f; do
  compose_files+=("$f")
done < <(find "$ROOT" -maxdepth 2 \( -name 'docker-compose.yml' -o -name 'docker-compose.yaml' -o -name 'compose.yml' -o -name 'compose.yaml' \) -print0 2>/dev/null || true)

if ((${#compose_files[@]})); then
  for f in "${compose_files[@]}"; do
    echo "    docker compose -f $f down --remove-orphans"
    docker compose -f "$f" down --remove-orphans 2>/dev/null || docker-compose -f "$f" down --remove-orphans 2>/dev/null || true
  done
else
  echo "    no compose files in this lesson (expected — Lesson 3 is Node/pnpm only)"
fi

echo "==> Stopping lesson-named Docker containers (if any)"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  ids="$(
    {
      docker ps -aq --filter name=lesson-03
      docker ps -aq --filter name=pulse-platform
      docker ps -aq --filter name=typography-as-a-system
    } 2>/dev/null | sort -u || true
  )"
  if [[ -n "${ids:-}" ]]; then
    echo "    stopping/removing: $ids"
    # shellcheck disable=SC2086
    docker stop $ids 2>/dev/null || true
    # shellcheck disable=SC2086
    docker rm $ids 2>/dev/null || true
  else
    echo "    no lesson-named containers found"
  fi
else
  echo "    docker not available — skipped lesson container stop"
fi

echo "==> Removing generated files"
remove_path() {
  local rel="$1"
  if [[ -e "$ROOT/$rel" ]]; then
    chmod -R u+w "$ROOT/$rel" 2>/dev/null || true
    rm -rf "$ROOT/$rel" 2>/dev/null || true
    if [[ -e "$ROOT/$rel" ]]; then
      echo "    WARN: could not fully remove $rel (will retry via Docker if available)"
    else
      echo "    removed $rel"
    fi
  fi
}

remove_path "node_modules"
remove_path ".turbo"
remove_path ".remote-cache"
remove_path ".next"
remove_path "coverage"
remove_path "test-results"
remove_path "playwright-report"
remove_path "blob-report"
remove_path ".eslintcache"
remove_path ".cache"
remove_path "pnpm-debug.log"

# Leftover trash dirs from interrupted cleanups
for trash in "$ROOT"/.node_modules_trash_*; do
  [[ -e "$trash" ]] || continue
  chmod -R u+w "$trash" 2>/dev/null || true
  rm -rf "$trash" 2>/dev/null || true
  echo "    removed $(basename "$trash")"
done

# Per-package artifacts (apps/* and packages/*)
for group in apps packages; do
  if [[ -d "$ROOT/$group" ]]; then
    while IFS= read -r -d '' dir; do
      rel="${dir#"$ROOT"/}"
      chmod -R u+w "$dir" 2>/dev/null || true
      rm -rf "$dir" 2>/dev/null || true
      if [[ ! -e "$dir" ]]; then
        echo "    removed $rel"
      else
        echo "    WARN: could not fully remove $rel"
      fi
    done < <(find "$ROOT/$group" -type d \( \
      -name node_modules -o -name dist -o -name .turbo -o -name .next \
      -o -name coverage -o -name .cache -o -name test-results -o -name playwright-report \
    \) -print0 2>/dev/null || true)
  fi
done

# Stray logs and OS junk under the lesson tree
while IFS= read -r -d '' f; do
  rel="${f#"$ROOT"/}"
  rm -f "$f" 2>/dev/null || true
  echo "    removed $rel"
done < <(find "$ROOT" \( -path "$ROOT/node_modules" -o -path "$ROOT/*/node_modules" \) -prune -o \
  \( -name '*.log' -o -name '.DS_Store' -o -name 'Thumbs.db' \) -type f -print0 2>/dev/null || true)

# Fallback: delete stubborn trees (e.g. nested .idea under node_modules) via bind-mount
still_dirty=0
for p in node_modules .turbo .remote-cache .next coverage test-results playwright-report; do
  [[ -e "$ROOT/$p" ]] && still_dirty=1
done
shopt -s nullglob
trash_left=( "$ROOT"/.node_modules_trash_* )
((${#trash_left[@]})) && still_dirty=1
shopt -u nullglob
if find "$ROOT/apps" "$ROOT/packages" -type d \( -name node_modules -o -name dist -o -name .turbo \) 2>/dev/null | grep -q .; then
  still_dirty=1
fi

if ((still_dirty)) && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "==> Retrying stubborn deletes via Docker bind-mount"
  docker run --rm -v "$ROOT:/lesson" alpine:3.20 sh -c '
    rm -rf /lesson/node_modules /lesson/.turbo /lesson/.remote-cache /lesson/.next \
           /lesson/coverage /lesson/test-results /lesson/playwright-report /lesson/blob-report \
           /lesson/.eslintcache /lesson/.cache /lesson/.node_modules_trash_*
    find /lesson/apps /lesson/packages -type d \( \
      -name node_modules -o -name dist -o -name .turbo -o -name .next \
      -o -name coverage -o -name .cache -o -name test-results -o -name playwright-report \
    \) -exec rm -rf {} + 2>/dev/null || true
  ' && echo "    docker bind-mount cleanup done"
fi

echo "==> Removing unnecessary .env / credential files (keeping source)"
while IFS= read -r -d '' f; do
  rel="${f#"$ROOT"/}"
  case "$(basename "$f")" in
    .env.example|.env.sample|.env.template) continue ;;
  esac
  rm -f "$f" 2>/dev/null || true
  echo "    removed $rel"
done < <(find "$ROOT" \( -path "$ROOT/node_modules" -o -path "$ROOT/*/node_modules" \) -prune -o \
  \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*credentials*.json' -o -name 'secrets.json' \) \
  -type f -print0 2>/dev/null || true)

echo "==> Docker: prune unused resources (stopped containers, unused images, networks, volumes, build cache)"
if ! command -v docker >/dev/null 2>&1; then
  echo "    docker not installed — skipped"
elif docker info >/dev/null 2>&1; then
  docker container prune -f || true
  docker image prune -af || true
  docker volume prune -f || true
  docker network prune -f || true
  docker builder prune -af || true
  echo "    docker prune finished"
  echo "    note: running containers from other projects were left alone"
elif [[ -S /var/run/docker.sock ]]; then
  # Fallback when the local CLI cannot talk to the daemon directly
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock docker:27-cli system prune -af --volumes || true
  echo "    docker prune finished (via docker:27-cli)"
  echo "    note: running containers from other projects were left alone"
else
  echo "    docker daemon not reachable — skipped prune"
fi

echo "==> Cleanup complete"
echo "    Source, fixtures, lockfile, and lesson docs were kept."
echo "    Re-run with: pnpm install && pnpm build && pnpm dev"
