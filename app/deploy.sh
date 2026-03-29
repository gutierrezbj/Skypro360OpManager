#!/bin/bash
# OpsManager — Deploy script
# Usage: ./deploy.sh [prod]
# Run from the VPS at /opt/apps/opsmanager/app/

set -euo pipefail

ENV="${1:-prod}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== OpsManager Deploy ($ENV) ==="
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# Pull latest code
echo "→ Pulling latest code..."
git pull origin main

# Build and restart
echo "→ Building and restarting containers..."
docker compose -f "$COMPOSE_FILE" up -d --build

# Wait for health check
echo "→ Waiting for health check..."
sleep 10
for i in {1..12}; do
  if curl -sf http://localhost:3100/api/health > /dev/null 2>&1; then
    echo "✓ App is healthy!"
    break
  fi
  if [ "$i" -eq 12 ]; then
    echo "✗ Health check failed after 60s"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 app
    exit 1
  fi
  sleep 5
done

# Show status
echo ""
echo "=== Container Status ==="
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "=== Deploy complete ==="
echo "URL: https://skp360mgr.systemrapid.io"
