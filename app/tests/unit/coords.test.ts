import { describe, it, expect } from "vitest";
import {
  parseDMS,
  parseDecimal,
  parseCoordinate,
  parseCoordPair,
  coerceCoordinateString,
} from "@/lib/geo/coords";

describe("parseDMS", () => {
  it("parsea N positivo con segundos", () => {
    // 36°25'04.88"N = 36 + 25/60 + 4.88/3600 ≈ 36.41802222
    expect(parseDMS(`36°25'04.88"N`)).toBeCloseTo(36.41802, 4);
  });

  it("parsea W como negativo", () => {
    expect(parseDMS(`5°09'13.11"W`)).toBeCloseTo(-5.15364, 4);
  });

  it("parsea O (notación española) como negativo", () => {
    expect(parseDMS(`5°09'13.11"O`)).toBeCloseTo(-5.15364, 4);
  });

  it("parsea S como negativo", () => {
    expect(parseDMS(`33°52'00\"S`)).toBeCloseTo(-33.86667, 3);
  });

  it("parsea con espacios", () => {
    expect(parseDMS(`36° 25' 4.88\" N`)).toBeCloseTo(36.41802, 4);
  });

  it("acepta solo grados + hemisferio", () => {
    expect(parseDMS("40°N")).toBeCloseTo(40, 4);
  });

  it("rechaza minutos >= 60", () => {
    expect(parseDMS(`36°60'00"N`)).toBeNull();
  });

  it("devuelve null para decimal puro", () => {
    expect(parseDMS("36.4180")).toBeNull();
  });
});

describe("parseDecimal", () => {
  it("parsea decimal positivo", () => {
    expect(parseDecimal("36.4180")).toBeCloseTo(36.418, 4);
  });

  it("parsea decimal negativo", () => {
    expect(parseDecimal("-5.1536")).toBeCloseTo(-5.1536, 4);
  });

  it("rechaza DMS", () => {
    expect(parseDecimal(`36°25'04"N`)).toBeNull();
  });
});

describe("parseCoordinate", () => {
  it("intenta DMS primero, luego decimal", () => {
    expect(parseCoordinate("36.418")).toBeCloseTo(36.418, 3);
    expect(parseCoordinate(`36°25'04.88"N`)).toBeCloseTo(36.41802, 4);
  });
});

describe("parseCoordPair", () => {
  it("decimal con coma", () => {
    const r = parseCoordPair("36.418, -5.1536");
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(36.418, 3);
    expect(r!.lng).toBeCloseTo(-5.1536, 3);
  });

  it("decimal con espacio", () => {
    const r = parseCoordPair("36.418 -5.1536");
    expect(r!.lat).toBeCloseTo(36.418, 3);
  });

  it("decimal en orden invertido (KMZ)", () => {
    const r = parseCoordPair("-5.1536, 36.418");
    expect(r!.lat).toBeCloseTo(36.418, 3);
    expect(r!.lng).toBeCloseTo(-5.1536, 3);
  });

  it("DMS pair con espacio", () => {
    const r = parseCoordPair(`36°25'04.88"N 5°09'13.11"W`);
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(36.41802, 4);
    expect(r!.lng).toBeCloseTo(-5.15364, 4);
  });

  it("DMS pair con coma", () => {
    const r = parseCoordPair(`36°25'04.88"N, 5°09'13.11"W`);
    expect(r!.lat).toBeCloseTo(36.41802, 4);
    expect(r!.lng).toBeCloseTo(-5.15364, 4);
  });

  it("DMS en orden invertido (lng primero)", () => {
    const r = parseCoordPair(`5°09'13.11"W 36°25'04.88"N`);
    expect(r!.lat).toBeCloseTo(36.41802, 4);
    expect(r!.lng).toBeCloseTo(-5.15364, 4);
  });

  it("rechaza texto sin coordenadas", () => {
    expect(parseCoordPair("Madrid")).toBeNull();
    expect(parseCoordPair("hola mundo")).toBeNull();
  });
});

describe("coerceCoordinateString", () => {
  it("convierte DMS a string decimal", () => {
    expect(coerceCoordinateString(`36°25'04.88"N`, "lat")).toMatch(/^36\.418/);
  });

  it("acepta decimal puro", () => {
    expect(coerceCoordinateString("36.418", "lat")).toBe("36.418");
  });

  it("acepta number", () => {
    expect(coerceCoordinateString(36.418, "lat")).toBe("36.418");
  });

  it("devuelve undefined para vacío/null/undefined", () => {
    expect(coerceCoordinateString("", "lat")).toBeUndefined();
    expect(coerceCoordinateString(null, "lat")).toBeUndefined();
    expect(coerceCoordinateString(undefined, "lat")).toBeUndefined();
  });

  it("lanza si formato no es válido", () => {
    expect(() => coerceCoordinateString("xyz", "lat")).toThrow(/inválido/);
  });

  it("lanza si lat fuera de rango", () => {
    expect(() => coerceCoordinateString("100", "lat")).toThrow(/rango/);
  });

  it("lanza si lng fuera de rango", () => {
    expect(() => coerceCoordinateString("200", "lng")).toThrow(/rango/);
  });

  it("acepta lng en rango pero rechaza si pasa como lat", () => {
    expect(() => coerceCoordinateString("150", "lat")).toThrow(/rango/);
    expect(coerceCoordinateString("150", "lng")).toBe("150");
  });
});
