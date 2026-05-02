#!/bin/bash
# OpsManager — Restore desde backup
#
# Uso:
#   ./restore-postgres.sh /opt/apps/opsmanager/backups/daily/opsmanager-YYYYMMDD-HHMMSS.sql.gz
#
# IMPORTANTE: este script DESTRUYE la BD actual y la reemplaza por el backup.
# Hace un backup de seguridad pre-restore por si hay que revertir.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: $0 <ruta-al-backup.sql.gz>"
  echo ""
  echo "Backups disponibles:"
  ls -lh /opt/apps/opsmanager/backups/daily/ 2>/dev/null | tail -10
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER="opsmanager-db"
DB_USER="opsmanager"
DB_NAME="opsmanager"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[ERROR] Archivo no encontrado: $BACKUP_FILE" >&2
  exit 1
fi

echo "⚠️  Vas a RESTAURAR la BD desde: $BACKUP_FILE"
echo "⚠️  Esto DESTRUYE los datos actuales."
read -p "Escribe 'CONFIRMAR' para continuar: " confirm
if [ "$confirm" != "CONFIRMAR" ]; then
  echo "Abortado."
  exit 1
fi

# Backup de seguridad pre-restore
SAFETY_BACKUP="/opt/apps/opsmanager/backups/pre-restore-$(date -u +%Y%m%d-%H%M%S).sql.gz"
echo "[$(date -u +%FT%TZ)] Creando safety backup: $SAFETY_BACKUP"
docker exec -t "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --format=plain --no-owner --no-acl --clean --if-exists | gzip -9 > "$SAFETY_BACKUP"

# Restore
echo "[$(date -u +%FT%TZ)] Restaurando desde $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

echo "[$(date -u +%FT%TZ)] Restore completado."
echo "Safety backup queda en: $SAFETY_BACKUP"
