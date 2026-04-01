#!/usr/bin/env python3
"""
OpsManager Telemetry Bridge — Matrice 400 companion computer
============================================================
Runs on a Raspberry Pi (Zero 2W / 4) connected to the DJI Matrice 400
via the PSDK expansion port.

Reads flight telemetry via MAVLink (DJI M400 exposes MAVLink 2 on
the PSDK UART at 921600 baud) and forwards to the OpsManager
/api/telemetry/position endpoint every 5 seconds.

Hardware connection:
  M400 PSDK port (UART) → Pi GPIO 14/15 (TX/RX) at 921600 baud
  OR
  M400 USB-C expansion → Pi USB-A via adapter

Dependencies:
  pip install pymavlink requests

Usage:
  python3 opsmanager_bridge.py --mission-id <SKY-2026-XXX>

Config via environment variables or .env file:
  OPSMANAGER_URL     https://skp360mgr.systemrapid.io
  TELEMETRY_API_KEY  <key from .env.production>
  MISSION_ID         SKY-2026-003   (override with --mission-id)
  MAVLINK_PORT       /dev/ttyAMA0   (default: auto-detect)
  MAVLINK_BAUD       921600
  SEND_INTERVAL      5              (seconds between POSTs)
"""

import argparse
import os
import sys
import time
import json
import logging
import threading
import requests
from pathlib import Path

# Load .env if present (no python-dotenv dependency needed)
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

OPSMANAGER_URL = os.environ.get("OPSMANAGER_URL", "https://skp360mgr.systemrapid.io").rstrip("/")
TELEMETRY_API_KEY = os.environ.get("TELEMETRY_API_KEY", "")
MISSION_ID = os.environ.get("MISSION_ID", "")
MAVLINK_PORT = os.environ.get("MAVLINK_PORT", "")
MAVLINK_BAUD = int(os.environ.get("MAVLINK_BAUD", "921600"))
SEND_INTERVAL = int(os.environ.get("SEND_INTERVAL", "5"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bridge")


def auto_detect_mavlink_port() -> str:
    """Try common serial ports in order."""
    candidates = [
        "/dev/ttyAMA0",   # Pi UART (GPIO)
        "/dev/ttyUSB0",   # USB serial adapter
        "/dev/ttyACM0",   # USB CDC
        "/dev/serial0",   # Pi alias
    ]
    for p in candidates:
        if Path(p).exists():
            log.info(f"Auto-detected MAVLink port: {p}")
            return p
    raise RuntimeError(
        "No serial port found. Set MAVLINK_PORT env var explicitly. "
        "Available: " + str(list(Path("/dev").glob("tty[AU]*")))
    )


class TelemetryState:
    """Thread-safe container for latest telemetry values."""
    def __init__(self):
        self._lock = threading.Lock()
        self.lat = 0.0
        self.lng = 0.0
        self.altitude = 0.0
        self.heading = 0.0
        self.speed_kmh = 0.0
        self.battery_pct = 100.0
        self.last_gps_ts = 0.0
        self.armed = False

    def update_gps(self, lat, lng, alt):
        with self._lock:
            self.lat = lat
            self.lng = lng
            self.altitude = alt
            self.last_gps_ts = time.time()

    def update_attitude(self, heading_deg):
        with self._lock:
            self.heading = heading_deg

    def update_speed(self, speed_ms):
        with self._lock:
            self.speed_kmh = round(speed_ms * 3.6, 1)

    def update_battery(self, remaining_pct):
        with self._lock:
            self.battery_pct = remaining_pct

    def update_armed(self, armed: bool):
        with self._lock:
            self.armed = armed

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "lat": self.lat,
                "lng": self.lng,
                "altitude": round(self.altitude, 1),
                "heading": round(self.heading, 1),
                "speed_kmh": self.speed_kmh,
                "battery_pct": round(self.battery_pct, 1),
                "last_gps_age": round(time.time() - self.last_gps_ts, 1),
            }


def mavlink_reader(port: str, baud: int, state: TelemetryState, stop_event: threading.Event):
    """Read MAVLink messages in a background thread."""
    try:
        from pymavlink import mavutil
    except ImportError:
        log.error("pymavlink not installed. Run: pip install pymavlink")
        stop_event.set()
        return

    log.info(f"Connecting to MAVLink on {port} @ {baud} baud...")
    try:
        mav = mavutil.mavlink_connection(port, baud=baud)
        mav.wait_heartbeat(timeout=10)
        log.info(f"Heartbeat received from system {mav.target_system}")
    except Exception as e:
        log.error(f"MAVLink connection failed: {e}")
        stop_event.set()
        return

    # Request data streams from flight controller
    mav.mav.request_data_stream_send(
        mav.target_system, mav.target_component,
        mavutil.mavlink.MAV_DATA_STREAM_ALL, 4, 1  # 4 Hz
    )

    import math

    while not stop_event.is_set():
        try:
            msg = mav.recv_match(blocking=True, timeout=1.0)
            if msg is None:
                continue

            mtype = msg.get_type()

            if mtype == "GLOBAL_POSITION_INT":
                state.update_gps(
                    lat=msg.lat / 1e7,
                    lng=msg.lon / 1e7,
                    alt=msg.relative_alt / 1000.0,  # mm → m AGL
                )
                vx = msg.vx / 100.0  # cm/s → m/s
                vy = msg.vy / 100.0
                speed = math.sqrt(vx**2 + vy**2)
                state.update_speed(speed)

            elif mtype == "ATTITUDE":
                heading = math.degrees(msg.yaw) % 360
                state.update_attitude(heading)

            elif mtype == "BATTERY_STATUS":
                if msg.battery_remaining >= 0:
                    state.update_battery(float(msg.battery_remaining))

            elif mtype == "HEARTBEAT":
                armed = bool(msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED)
                state.update_armed(armed)

        except Exception as e:
            log.warning(f"MAVLink read error: {e}")
            time.sleep(0.5)

    log.info("MAVLink reader stopped.")


def post_telemetry(mission_id: str, state: TelemetryState) -> bool:
    """POST latest position to OpsManager."""
    snap = state.snapshot()

    if snap["last_gps_age"] > 30:
        log.warning(f"GPS stale ({snap['last_gps_age']}s) — skipping POST")
        return False

    if snap["lat"] == 0.0 and snap["lng"] == 0.0:
        log.warning("No GPS fix yet — skipping POST")
        return False

    payload = {
        "missionId": mission_id,
        "lat": snap["lat"],
        "lng": snap["lng"],
        "altitude": snap["altitude"],
        "heading": snap["heading"],
        "speedKmh": snap["speed_kmh"],
        "batteryPct": snap["battery_pct"],
    }

    try:
        resp = requests.post(
            f"{OPSMANAGER_URL}/api/telemetry/position",
            json=payload,
            headers={"Authorization": f"Bearer {TELEMETRY_API_KEY}"},
            timeout=5,
        )
        if resp.status_code == 200:
            log.info(
                f"OK → lat={snap['lat']:.6f} lng={snap['lng']:.6f} "
                f"alt={snap['altitude']}m hdg={snap['heading']}° "
                f"spd={snap['speed_kmh']}km/h bat={snap['battery_pct']}%"
            )
            return True
        else:
            log.error(f"POST failed {resp.status_code}: {resp.text[:200]}")
    except requests.RequestException as e:
        log.error(f"Network error: {e}")

    return False


def main():
    parser = argparse.ArgumentParser(description="OpsManager Telemetry Bridge")
    parser.add_argument("--mission-id", default=MISSION_ID, help="Mission code (SKY-2026-XXX)")
    parser.add_argument("--port", default=MAVLINK_PORT, help="Serial port (default: auto-detect)")
    parser.add_argument("--baud", type=int, default=MAVLINK_BAUD, help="Baud rate")
    parser.add_argument("--interval", type=int, default=SEND_INTERVAL, help="POST interval seconds")
    parser.add_argument("--dry-run", action="store_true", help="Print data without POSTing")
    args = parser.parse_args()

    if not args.mission_id:
        parser.error("--mission-id required (or set MISSION_ID env var)")

    if not TELEMETRY_API_KEY and not args.dry_run:
        parser.error("TELEMETRY_API_KEY env var not set")

    port = args.port or auto_detect_mavlink_port()

    log.info(f"OpsManager Telemetry Bridge")
    log.info(f"  Mission:  {args.mission_id}")
    log.info(f"  Endpoint: {OPSMANAGER_URL}")
    log.info(f"  Port:     {port} @ {args.baud}")
    log.info(f"  Interval: {args.interval}s")
    log.info(f"  Dry run:  {args.dry_run}")

    state = TelemetryState()
    stop_event = threading.Event()

    reader_thread = threading.Thread(
        target=mavlink_reader,
        args=(port, args.baud, state, stop_event),
        daemon=True,
    )
    reader_thread.start()

    log.info("Waiting for GPS fix...")
    time.sleep(3)

    try:
        while not stop_event.is_set():
            if args.dry_run:
                snap = state.snapshot()
                log.info(f"DRY RUN: {json.dumps(snap)}")
            else:
                post_telemetry(args.mission_id, state)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        log.info("Shutting down...")
    finally:
        stop_event.set()
        reader_thread.join(timeout=3)


if __name__ == "__main__":
    main()
