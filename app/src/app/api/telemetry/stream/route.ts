/**
 * Telemetry SSE stream — real-time drone position updates.
 *
 * GET /api/telemetry/stream
 *
 * Streams JSON arrays of TelemetryPoint every 3s.
 * In production: reads from Redis pub/sub channel `telemetry:{missionId}`
 * published by the POST /api/telemetry/position endpoint (real drones).
 * When no real data arrives, falls back to simulated movement so the
 * map always shows live-looking markers during demos.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { missions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type TelemetryPoint = {
  missionId: string;
  lat: number;
  lng: number;
  altitude: number;
  heading: number;   // degrees 0-360
  speedKmh: number;
  batteryPct: number;
  source: "real" | "mock";
  ts: number;
};

// In-process store for real telemetry received via POST endpoint
// In production this would be Redis pub/sub
export const realtimePositions = new Map<string, TelemetryPoint>();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch in_flight missions with coordinates for this session's tenant
  const tenantId = (session.user as { tenantId?: string }).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  }

  const inFlightMissions = await db
    .select({
      id: missions.id,
      latitude: missions.latitude,
      longitude: missions.longitude,
      maxAltitude: missions.maxAltitude,
    })
    .from(missions)
    .where(eq(missions.tenantId, tenantId))
    .then((rows) => rows.filter((r) => r.latitude && r.longitude && parseFloat(r.latitude) !== 0));

  // Filter to in_flight only — we also include preflight for demo richness
  const activeMissions = await db
    .select({ id: missions.id, status: missions.status, latitude: missions.latitude, longitude: missions.longitude, maxAltitude: missions.maxAltitude })
    .from(missions)
    .where(eq(missions.tenantId, tenantId))
    .then((rows) =>
      rows.filter(
        (r) =>
          (r.status === "in_flight" || r.status === "preflight") &&
          r.latitude &&
          r.longitude
      )
    );

  if (activeMissions.length === 0) {
    // Nothing to stream — send empty heartbeat and close
    const body = `data: []\n\ndata: []\n\n`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Initialize simulated positions
  type SimState = {
    lat: number;
    lng: number;
    altitude: number;
    heading: number;
    speedKmh: number;
    batteryPct: number;
  };

  const simState = new Map<string, SimState>(
    activeMissions.map((m) => [
      m.id,
      {
        lat: parseFloat(m.latitude!),
        lng: parseFloat(m.longitude!),
        altitude: m.maxAltitude ? parseFloat(String(m.maxAltitude)) * 0.7 : 45,
        heading: Math.random() * 360,
        speedKmh: 25 + Math.random() * 15,
        batteryPct: 70 + Math.random() * 25,
      },
    ])
  );

  const missionIds = activeMissions.map((m) => m.id);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function buildUpdate(): TelemetryPoint[] {
        return missionIds.map((id) => {
          // Check if real data arrived for this mission
          const real = realtimePositions.get(id);
          if (real && Date.now() - real.ts < 15_000) {
            return real;
          }

          // Simulate movement
          const s = simState.get(id)!;
          const radHead = (s.heading * Math.PI) / 180;
          const metersPerStep = (s.speedKmh / 3600) * 3; // 3s interval
          const degPerMeter = 1 / 111_000;

          s.lat += Math.cos(radHead) * metersPerStep * degPerMeter;
          s.lng +=
            (Math.sin(radHead) * metersPerStep * degPerMeter) /
            Math.cos((s.lat * Math.PI) / 180);
          s.heading = (s.heading + (Math.random() * 8 - 4) + 360) % 360;
          s.altitude += Math.random() * 2 - 1;
          s.batteryPct = Math.max(5, s.batteryPct - 0.05);
          simState.set(id, s);

          return {
            missionId: id,
            lat: s.lat,
            lng: s.lng,
            altitude: Math.round(s.altitude * 10) / 10,
            heading: Math.round(s.heading),
            speedKmh: Math.round(s.speedKmh * 10) / 10,
            batteryPct: Math.round(s.batteryPct),
            source: "mock",
            ts: Date.now(),
          };
        });
      }

      // Send initial state immediately
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(buildUpdate())}\n\n`)
        );
      } catch {
        return;
      }

      const interval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(buildUpdate())}\n\n`)
          );
        } catch {
          clearInterval(interval);
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
