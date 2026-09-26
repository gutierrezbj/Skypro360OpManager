#!/usr/bin/env bash
# Recordatorios de coordinaciones aeronáuticas (10/5/3 días antes del límite).
# Cron diario en el VPS, ej.: 0 7 * * * /opt/apps/opsmanager/ops/coordination-reminders.sh >> /var/log/opsmanager-reminders.log 2>&1
set -euo pipefail

ENV_FILE="/opt/apps/opsmanager/app/.env.production"
SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)"

if [ -z "$SECRET" ]; then
  echo "[$(date -u +%FT%TZ)] CRON_SECRET no definido en $ENV_FILE" >&2
  exit 1
fi

echo "[$(date -u +%FT%TZ)] coordination-reminders"
curl -sS -X POST \
  -H "Authorization: Bearer $SECRET" \
  --max-time 120 \
  http://localhost:3100/api/cron/coordination-reminders
echo
