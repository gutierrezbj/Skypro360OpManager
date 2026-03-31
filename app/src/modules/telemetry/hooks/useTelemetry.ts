"use client";

import { useEffect, useRef, useState } from "react";
import type { TelemetryPoint } from "@/app/api/telemetry/stream/route";

export type { TelemetryPoint };

/**
 * Consumes the SSE telemetry stream and returns a map of
 * missionId → latest TelemetryPoint.
 *
 * Only active when there are in_flight/preflight missions.
 * Reconnects automatically on disconnect.
 */
export function useTelemetry(): Map<string, TelemetryPoint> {
  const [positions, setPositions] = useState<Map<string, TelemetryPoint>>(
    new Map()
  );
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      esRef.current?.close();
      const es = new EventSource("/api/telemetry/stream");
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const points: TelemetryPoint[] = JSON.parse(event.data as string);
          if (points.length === 0) return;
          setPositions(new Map(points.map((p) => [p.missionId, p])));
        } catch {
          // malformed event — ignore
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 5s
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return positions;
}
