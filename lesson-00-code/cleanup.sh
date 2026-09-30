#!/usr/bin/env bash
# Stop Docker containers and prune unused Docker resources.
set -euo pipefail

echo "==> Docker cleanup"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI not found — skipping container/image cleanup."
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running (or not accessible) — nothing to clean."
  # Still attempt to stop the service if we have permission.
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl stop docker.socket 2>/dev/null || true
    sudo systemctl stop docker 2>/dev/null || true
    echo "Requested docker service stop (if permitted)."
  fi
  exit 0
fi

echo "Stopping all running containers..."
running="$(docker ps -q 2>/dev/null || true)"
if [[ -n "${running}" ]]; then
  docker stop ${running}
else
  echo "No running containers."
fi

echo "Removing all containers..."
all="$(docker ps -aq 2>/dev/null || true)"
if [[ -n "${all}" ]]; then
  docker rm -f ${all}
else
  echo "No containers to remove."
fi

echo "Removing unused images, networks, volumes, and build cache..."
docker system prune -af --volumes

echo "Stopping Docker service..."
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl stop docker.socket 2>/dev/null || true
  sudo systemctl stop docker 2>/dev/null || true
fi

echo "==> Docker cleanup complete."
