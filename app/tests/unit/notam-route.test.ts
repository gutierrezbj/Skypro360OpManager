/**
 * Tests for GET /api/airspace/notams
 * Mocks node:https to avoid real network calls.
 * Verifies normalization, cache behaviour, and error handling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock node:https before importing the route ────────────────────────────────

const mockHttpsGet = vi.fn();
vi.mock("node:https", () => ({ default: { get: mockHttpsGet } }));

// ── Mock next/server (NextResponse.json) ─────────────────────────────────────

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { headers?: Record<string, string>; status?: number }) => ({
      _body: body,
      _status: init?.status ?? 200,
      _headers: init?.headers ?? {},
      json: async () => body,
    }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a fake EventEmitter-style res object httpsGet expects */
function makeRes(
  statusCode: number,
  chunks: string[],
): Record<string, unknown> {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    statusCode,
    resume: vi.fn(),
    on: (event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(cb);
    },
    _emit: (event: string, ...args: unknown[]) => {
      (handlers[event] ?? []).forEach((h) => h(...args));
    },
  };
}

/** Calls mockHttpsGet with a fake successful response */
function mockEnaire(geojson: unknown) {
  mockHttpsGet.mockImplementation(
    (_url: string, _opts: unknown, callback: (res: unknown) => void) => {
      const res = makeRes(200, []);
      callback(res);
      const r = res as ReturnType<typeof makeRes>;
      r._emit("data", JSON.stringify(geojson));
      r._emit("end");
      return { setTimeout: vi.fn(), on: vi.fn() };
    },
  );
}

/** A minimal GeoJSON FeatureCollection from ENAIRE */
const SAMPLE_ENAIRE_RESPONSE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
      properties: {
        notamId: "LEMD123",
        notamSerie: "A",
        notamNumber: 42,
        notamYear: 2026,
        itemA: "LEMD",
        itemE: "UAS ops restricted",
        LOWER_VAL: "SFC",
        UPPER_VAL: "2000FT",
        FLYING_LEVELS_DESC: null,
        DESCRIPTION: "<p>Zona restringida UAS</p>",
        fir: "LECM",
      },
    },
    {
      // Feature without geometry — should be filtered out
      type: "Feature",
      geometry: null,
      properties: { notamId: "LEAK99" },
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/airspace/notams", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("normalizes ENAIRE fields to internal schema", async () => {
    mockEnaire(SAMPLE_ENAIRE_RESPONSE);
    const { GET } = await import("@/app/api/airspace/notams/route");
    const res = await GET();
    const body = res._body as ReturnType<typeof import("@/app/api/airspace/notams/route").GET> extends Promise<infer R> ? R : never;
    const data = body as { features: { properties: Record<string, unknown> }[]; count: number };

    // Only the feature with geometry passes through
    expect(data.count).toBe(1);
    expect(data.features).toHaveLength(1);

    const props = data.features[0].properties;
    // id built from serie + number + year
    expect(props.id).toBe("A0042/26");
    // name from itemA
    expect(props.name).toBe("FIR LEMD");
    expect(props.type).toBe("NOTAM");
    expect(props.restriction).toBe("CONDITIONAL");
    expect(props.altitudeFloor).toBe("SFC");
    expect(props.altitudeCeiling).toBe("2000FT");
    // HTML stripped from DESCRIPTION
    expect(props.description).toBe("Zona restringida UAS");
    expect(props.source).toBe("ENAIRE NOTAM_UAS_APP_V3");
  });

  it("uses notamId as fallback when serie is absent", async () => {
    mockEnaire({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: {
            notamId: "FALLBACK-ID",
            notamSerie: null,
            itemA: null,
            fir: "LECM",
            LOWER_VAL: null,
            UPPER_VAL: null,
            DESCRIPTION: null,
            FLYING_LEVELS_DESC: null,
            itemE: "raw text",
          },
        },
      ],
    });

    const { GET } = await import("@/app/api/airspace/notams/route");
    const res = await GET();
    const data = res._body as { features: { properties: Record<string, unknown> }[] };

    expect(data.features[0].properties.id).toBe("FALLBACK-ID");
    expect(data.features[0].properties.name).toBe("LECM");
    // Falls back to itemE when DESCRIPTION is null
    expect(data.features[0].properties.description).toBe("raw text");
  });

  it("returns X-Cache: MISS on first fetch", async () => {
    mockEnaire(SAMPLE_ENAIRE_RESPONSE);
    const { GET } = await import("@/app/api/airspace/notams/route");
    const res = await GET();
    expect(res._headers["X-Cache"]).toBe("MISS");
  });

  it("returns 503 when ENAIRE fails and no cache exists", async () => {
    mockHttpsGet.mockImplementation(
      (_url: string, _opts: unknown, _cb: unknown) => {
        const req = {
          setTimeout: vi.fn(),
          on: (_event: string, cb: () => void) => {
            if (_event === "error") cb();
          },
          destroy: vi.fn(),
        };
        return req;
      },
    );

    const { GET } = await import("@/app/api/airspace/notams/route");
    const res = await GET();
    expect(res._status).toBe(503);
    const body = res._body as { error: string };
    expect(body.error).toContain("ENAIRE");
  });

  it("includes fetchedAt ISO timestamp in response", async () => {
    mockEnaire(SAMPLE_ENAIRE_RESPONSE);
    const { GET } = await import("@/app/api/airspace/notams/route");
    const res = await GET();
    const data = res._body as { fetchedAt: string };
    expect(data.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("filters out features with null geometry", async () => {
    mockEnaire({
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: null, properties: { notamId: "X1" } },
        { type: "Feature", geometry: null, properties: { notamId: "X2" } },
      ],
    });

    const { GET } = await import("@/app/api/airspace/notams/route");
    const res = await GET();
    const data = res._body as { count: number };
    expect(data.count).toBe(0);
  });
});
