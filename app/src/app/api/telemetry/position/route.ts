/**
 * Real drone telemetry ingestion endpoint.
 *
 * POST /api/telemetry/position
 * Authorization: Bearer <TELEMETRY_API_KEY>
 * Content-Type: application/json
 *
 * Body: {
 *   missionId: string,
 *   lat: number,
 *   lng: number,
 *   altitude?: number,   // meters AGL
 *   heading?: number,    // degrees 0-360
 *   speedKmh?: number,
 *   batteryPct?: number,
 * }
 *
 * Compatible sources:
 * - DJI Pilot 2 via FlightHub 2 webhook / custom MSDK app
 * - MAVLink bridge (ArduPilot / PX4 → HTTP forwarder)
 * - Companion computer (RasPi on drone → cellular → POST here)
 * - Pilot mobile app (GPS bridge app → POST here every 5s)
 *
 * Stores in realtimePositions map shared with the SSE stream.
 * Production upgrade: publish to Redis channel `telemetry:{missionId}`
 * so multiple SSE connections receive it.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { realtimePositions } from "../stream/route";

const schema = z.object({
  missionId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speedKmh: z.number().min(0).optional(),
  batteryPct: z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
  const expectedKey = process.env.TELEMETRY_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { missionId, lat, lng, altitude, heading, speedKmh, batteryPct } = parsed.data;

  realtimePositions.set(missionId, {
    missionId,
    lat,
    lng,
    altitude: altitude ?? 0,
    heading: heading ?? 0,
    speedKmh: speedKmh ?? 0,
    batteryPct: batteryPct ?? 100,
    source: "real",
    ts: Date.now(),
  });

  return NextResponse.json({ ok: true, ts: Date.now() });
}
