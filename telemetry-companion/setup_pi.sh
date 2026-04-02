#!/bin/bash
# OpsManager Telemetry Bridge — Raspberry Pi Setup
# Run as root on the companion Pi:
#   curl -fsSL https://raw.githubusercontent.com/gutierrezbj/Skypro360OpManager/main/telemetry-companion/setup_pi.sh | sudo bash

set -e

INSTALL_DIR="/opt/opsmanager-bridge"
SERVICE_NAME="opsmanager-bridge"
PYTHON="python3"

echo "=== OpsManager Telemetry Bridge — setup ==="

# 1. Dependencies
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-serial

pip3 install pymavlink requests --quiet

# 2. Enable UART on Pi (GPIO 14/15) — idempotente
if ! grep -q "^enable_uart=1" /boot/config.txt 2>/dev/null && \
   ! grep -q "^enable_uart=1" /boot/firmware/config.txt 2>/dev/null; then
    BOOT_CFG="/boot/config.txt"
    [ -f /boot/firmware/config.txt ] && BOOT_CFG="/boot/firmware/config.txt"
    echo "enable_uart=1" >> "$BOOT_CFG"
    echo "[setup] UART enabled in $BOOT_CFG — reboot required after setup"
fi

# Disable serial console so UART is free for MAVLink
if grep -q "console=serial0" /boot/cmdline.txt 2>/dev/null; then
    sed -i 's/console=serial0,[0-9]* //' /boot/cmdline.txt
    echo "[setup] Serial console disabled from cmdline.txt"
fi

# 3. Install bridge files
mkdir -p "$INSTALL_DIR"
cp "$(dirname "$0")/opsmanager_bridge.py" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/opsmanager_bridge.py"

# 4. Create .env if not present
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp "$(dirname "$0")/.env.example" "$INSTALL_DIR/.env"
    echo ""
    echo "[setup] Edit $INSTALL_DIR/.env before starting the service:"
    echo "  OPSMANAGER_URL=https://skp360mgr.systemrapid.io"
    echo "  TELEMETRY_API_KEY=<key>"
    echo "  MISSION_ID=SKY-2026-XXX"
    echo "  MAVLINK_PORT=/dev/ttyAMA0"
fi

# 5. systemd service
cat > /etc/systemd/system/${SERVICE_NAME}.service << 'EOF'
[Unit]
Description=OpsManager Telemetry Bridge
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/opsmanager-bridge
EnvironmentFile=/opt/opsmanager-bridge/.env
ExecStart=/usr/bin/python3 /opt/opsmanager-bridge/opsmanager_bridge.py
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}

echo ""
echo "=== Setup completo ==="
echo ""
echo "Pasos siguientes:"
echo "  1. Editar /opt/opsmanager-bridge/.env con TELEMETRY_API_KEY y MISSION_ID"
echo "  2. Conectar UART del M400 a GPIO 14(TX)/15(RX) del Pi"
echo "  3. sudo systemctl start opsmanager-bridge"
echo "  4. sudo journalctl -fu opsmanager-bridge   # ver logs en tiempo real"
echo ""
echo "Test sin drone (dry-run):"
echo "  python3 /opt/opsmanager-bridge/opsmanager_bridge.py --mission-id SKY-2026-001 --dry-run"
