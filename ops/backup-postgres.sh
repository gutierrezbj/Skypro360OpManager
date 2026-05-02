#!/bin/bash
# OpsManager — Backup automático Postgres
#
# Ejecuta pg_dump dentro del contenedor opsmanager-db, comprime con gzip,
# rota mantenimiento (mantiene 14 diarios + 4 semanales + 6 mensuales).
#
# Uso (cron diario 03:15 UTC):
#   15 3 * * * /opt/apps/opsmanager/ops/backup-postgres.sh >> /var/log/opsmanager-backup.log 2>&1

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
BACKUP_DIR="/opt/apps/opsmanager/backups"
CONTAINER="opsmanager-db"
DB_USER="opsmanager"
DB_NAME="opsmanager"

DATE_TS=$(date -u +"%Y%m%d-%H%M%S")
DOW=$(date -u +"%u")          # 1=lun, 7=dom
DOM=$(date -u +"%d")          # 01-31

DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

# ── Backup principal ──────────────────────────────────────────────────────────
echo "[$(date -u +%FT%TZ)] Starting backup..."

DAILY_FILE="$DAILY_DIR/opsmanager-${DATE_TS}.sql.gz"

docker exec -t "$CONTAINER" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip -9 > "$DAILY_FILE"

if [ ! -s "$DAILY_FILE" ]; then
  echo "[ERROR] Backup vacío o falló: $DAILY_FILE" >&2
  rm -f "$DAILY_FILE"
  exit 1
fi

SIZE=$(du -h "$DAILY_FILE" | cut -f1)
echo "[$(date -u +%FT%TZ)] Backup OK: $DAILY_FILE ($SIZE)"

# ── Promoción semanal (domingos) ──────────────────────────────────────────────
if [ "$DOW" = "7" ]; then
  cp "$DAILY_FILE" "$WEEKLY_DIR/opsmanager-week-${DATE_TS}.sql.gz"
  echo "[$(date -u +%FT%TZ)] Promovido a semanal"
fi

# ── Promoción mensual (día 1 del mes) ─────────────────────────────────────────
if [ "$DOM" = "01" ]; then
  cp "$DAILY_FILE" "$MONTHLY_DIR/opsmanager-month-${DATE_TS}.sql.gz"
  echo "[$(date -u +%FT%TZ)] Promovido a mensual"
fi

# ── Rotación ──────────────────────────────────────────────────────────────────
# Diarios: conservar 14 más recientes
find "$DAILY_DIR" -name "opsmanager-*.sql.gz" -type f -printf "%T@ %p\n" | sort -rn | tail -n +15 | cut -d' ' -f2- | xargs -r rm -f
# Semanales: conservar 4 más recientes
find "$WEEKLY_DIR" -name "opsmanager-week-*.sql.gz" -type f -printf "%T@ %p\n" | sort -rn | tail -n +5 | cut -d' ' -f2- | xargs -r rm -f
# Mensuales: conservar 6 más recientes
find "$MONTHLY_DIR" -name "opsmanager-month-*.sql.gz" -type f -printf "%T@ %p\n" | sort -rn | tail -n +7 | cut -d' ' -f2- | xargs -r rm -f

# ── Resumen ───────────────────────────────────────────────────────────────────
echo "[$(date -u +%FT%TZ)] Estado actual:"
echo "  Diarios:    $(ls -1 "$DAILY_DIR" 2>/dev/null | wc -l) archivos"
echo "  Semanales:  $(ls -1 "$WEEKLY_DIR" 2>/dev/null | wc -l) archivos"
echo "  Mensuales:  $(ls -1 "$MONTHLY_DIR" 2>/dev/null | wc -l) archivos"
echo "  Espacio:    $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
echo "[$(date -u +%FT%TZ)] Backup terminado."
