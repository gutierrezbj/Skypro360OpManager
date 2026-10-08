import { describe, it, expect } from "vitest";
import { parseCompactDMS, parseCoordinate, parseCoordPair, coerceCoordinateString } from "@/lib/geo/coords";

describe("parseCompactDMS (DDMMSS.ss sin símbolos, formato AESA/NOTAM)", () => {
  it("caso real de Luis: 370850.315279 → 37°08'50.32\"", () => {
    expect(parseCompactDMS("370850.315279")).toBeCloseTo(37.147310, 5);
  });

  it("negativo con 1 dígito de grados: -33619.401328 → -3°36'19.40\"", () => {
    expect(parseCompactDMS("-33619.401328")).toBeCloseTo(-3.605389, 5);
  });

  it("longitud con 3 dígitos de grados y hemisferio: 0044617.4W", () => {
    expect(parseCompactDMS("0044617.4W")).toBeCloseTo(-4.771500, 5);
  });

  it("sin decimales y con N", () => {
    expect(parseCompactDMS("362934N")).toBeCloseTo(36.492778, 5);
  });

  it("rechaza minutos o segundos ≥ 60", () => {
    expect(parseCompactDMS("376050")).toBeNull();
    expect(parseCompactDMS("370860")).toBeNull();
  });

  it("no captura decimales normales", () => {
    expect(parseCompactDMS("36.4929")).toBeNull();
    expect(parseCompactDMS("-4.7715")).toBeNull();
    expect(parseCompactDMS("1234")).toBeNull();
  });
});

describe("integración compacto", () => {
  it("parseCoordinate elige compacto antes que decimal", () => {
    expect(parseCoordinate("370850.315279")).toBeCloseTo(37.147310, 5);
    expect(parseCoordinate("36.4929")).toBeCloseTo(36.4929, 4);
  });

  it("parseCoordPair acepta par compacto pegado", () => {
    const r = parseCoordPair("370850.315279, -33619.401328");
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(37.147310, 5);
    expect(r!.lng).toBeCloseTo(-3.605389, 5);
  });

  it("coerceCoordinateString devuelve decimal canónico en rango", () => {
    expect(Number(coerceCoordinateString("370850.315279", "lat"))).toBeCloseTo(37.147310, 5);
    expect(Number(coerceCoordinateString("-33619.401328", "lng"))).toBeCloseTo(-3.605389, 5);
  });
});
