#!/bin/bash
# Cambia la misión activa del bridge sin reiniciar el servicio base
# Uso: ./set_mission.sh SKY-2026-005
# El bridge se reinicia automáticamente con la nueva MISSION_ID

set -e

INSTALL_DIR="/opt/opsmanager-bridge"
SERVICE_NAME="opsmanager-bridge"
MISSION_ID="$1"

if [ -z "$MISSION_ID" ]; then
    echo "Uso: $0 <MISSION_ID>"
    echo "Ejemplo: $0 SKY-2026-005"
    exit 1
fi

# Validar formato
if ! echo "$MISSION_ID" | grep -qE '^SKY-[0-9]{4}-[0-9]+$'; then
    echo "Formato incorrecto. Esperado: SKY-YYYY-NNN"
    exit 1
fi

# Actualizar .env
sed -i "s/^MISSION_ID=.*/MISSION_ID=${MISSION_ID}/" "$INSTALL_DIR/.env"
echo "[ok] MISSION_ID → $MISSION_ID"

# Reiniciar servicio
systemctl restart "$SERVICE_NAME"
echo "[ok] Servicio reiniciado"

sleep 2
systemctl is-active --quiet "$SERVICE_NAME" && echo "[ok] Bridge activo" || echo "[!] Bridge no arrancó — revisar: journalctl -fu $SERVICE_NAME"
