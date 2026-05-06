/**
 * Tests del proxy /api/geocode (Open-Meteo geocoding).
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
    const res = await GET(makeReq("?q=Trujillo"));
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

  it("filtra IDs y population de la respuesta de Open-Meteo", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 2510409,
              name: "Trujillo",
              latitude: 39.45848,
              longitude: -5.88157,
              country: "España",
              country_code: "ES",
              admin1: "Extremadura",
              admin2: "Cáceres",
              population: 9650,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await GET(makeReq("?q=Trujillo"));
    const body = (await res.json()) as { results: Array<Record<string, unknown>> };

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    const r = body.results[0];
    expect(r.name).toBe("Trujillo");
    expect(r.lat).toBe(39.45848);
    expect(r.lng).toBe(-5.88157);
    expect(r.admin1).toBe("Extremadura");
    expect(r.admin2).toBe("Cáceres");
    // No exponemos id ni population
    expect(r.id).toBeUndefined();
    expect(r.population).toBeUndefined();
  });

  it("devuelve array vacío si Open-Meteo falla", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", email: "x@x.es", role: "admin", tenantId: "t1" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("oops", { status: 500 }),
    );
    const res = await GET(makeReq("?q=NoExiste"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
  });
});
