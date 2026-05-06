/**
 * Tests del proxy /api/geocode (Nominatim / OpenStreetMap).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock auth() ANTES de importar la route
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { GET } from "@/app/api/geocode/route";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const mockAuth = vi.mocked(auth);

function makeReq(query: string): NextRequest {
  const url = `http://localhost/api/geocode${query}`;
  return new NextRequest(url);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/geocode", () => {
  it("retorna 401 si no hay sesión", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET(makeReq("?q=Madrid"));
    expect(res.status).toBe(401);
  });

  it("retorna lista vacía si q tiene <2 caracteres", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await GET(makeReq("?q=a"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normaliza una dirección con calle y número (Nominatim, 2+ resultados)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            display_name: "12, Calle Mayor, Centro, Madrid, España",
            lat: "40.41675",
            lon: "-3.70378",
            address: {
              house_number: "12",
              road: "Calle Mayor",
              city: "Madrid",
              state: "Comunidad de Madrid",
              country: "España",
              country_code: "es",
            },
          },
          {
            display_name: "14, Calle Mayor, Centro, Madrid, España",
            lat: "40.41680",
            lon: "-3.70390",
            address: {
              house_number: "14",
              road: "Calle Mayor",
              city: "Madrid",
              state: "Comunidad de Madrid",
              country: "España",
              country_code: "es",
            },
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await GET(makeReq("?q=Calle+Mayor+12+Madrid"));
    const body = (await res.json()) as { results: Array<Record<string, unknown>> };

    expect(res.status).toBe(200);
    expect(body.results.length).toBeGreaterThanOrEqual(1);
    const r = body.results[0];
    expect(r.name).toBe("Calle Mayor 12");
    expect(r.admin1).toBe("Comunidad de Madrid");
    expect(r.admin2).toBe("Madrid");
    expect(r.countryCode).toBe("ES");
  });

  it("hace fallback a Photon cuando Nominatim devuelve <2 resultados", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      // Nominatim → 0 resultados
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      )
      // Photon → 1 resultado
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [-5.88157, 39.45848] },
                properties: {
                  name: "Trujillo",
                  city: "Trujillo",
                  county: "Cáceres",
                  state: "Extremadura",
                  country: "España",
                  countrycode: "ES",
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const res = await GET(makeReq("?q=Trujillo+rural"));
    const body = (await res.json()) as { results: Array<Record<string, unknown>> };

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // Nominatim + Photon
    expect(body.results).toHaveLength(1);
    expect(body.results[0].name).toBe("Trujillo");
    expect(body.results[0].lat).toBeCloseTo(39.45848);
  });

  it("devuelve array vacío si ambos motores fallan", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("nope", { status: 500 }))
      .mockResolvedValueOnce(new Response("nope", { status: 500 }));
    const res = await GET(makeReq("?q=NoExisteNada"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
  });

  it("envía User-Agent obligatorio a Nominatim", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), { status: 200 }),
      );
    await GET(makeReq("?q=Madrid"));
    const nominatimCall = fetchSpy.mock.calls[0];
    const opts = nominatimCall[1] as RequestInit;
    const headers = (opts?.headers ?? {}) as Record<string, string>;
    expect(headers["User-Agent"]).toMatch(/OpsManager/);
  });
});
