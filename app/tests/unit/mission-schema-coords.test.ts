import { describe, it, expect } from "vitest";
import { missionCreateSchema } from "@/modules/missions/schemas/mission.schema";

describe("missionCreateSchema — coordenadas", () => {
  it("acepta decimal y DMS y los normaliza a string decimal", () => {
    const r = missionCreateSchema.safeParse({
      name: "Test",
      latitude: `36°25'04.88"N`,
      longitude: "-5.15364",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(Number(r.data.latitude)).toBeCloseTo(36.41802, 4);
      expect(r.data.longitude).toBe("-5.15364");
    }
  });

  it("coordenada inválida devuelve error, no lanza", () => {
    let r: ReturnType<typeof missionCreateSchema.safeParse> | undefined;
    expect(() => {
      r = missionCreateSchema.safeParse({ name: "Test", latitude: "esto no es una coordenada", longitude: "-5.1" });
    }).not.toThrow();
    expect(r!.success).toBe(false);
    if (!r!.success) {
      expect(r!.error.issues[0].path).toEqual(["latitude"]);
      expect(r!.error.issues[0].message).toMatch(/latitud/i);
    }
  });

  it("fuera de rango devuelve error en el campo correcto", () => {
    const r = missionCreateSchema.safeParse({ name: "Test", latitude: "36.4", longitude: "200" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["longitude"]);
  });

  it("vacío es opcional", () => {
    const r = missionCreateSchema.safeParse({ name: "Test", latitude: "", longitude: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.latitude).toBeUndefined();
      expect(r.data.longitude).toBeUndefined();
    }
  });
});
