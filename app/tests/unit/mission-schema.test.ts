import { describe, it, expect } from "vitest";
import {
  missionCreateSchema,
  missionUpdateSchema,
  missionTransitionSchema,
} from "@/modules/missions/schemas/mission.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Mission Create Schema", () => {
  it("accepts valid complete data", () => {
    const result = missionCreateSchema.safeParse({
      name: "Inspeccion planta solar",
      description: "Vuelo fotovoltaico zona A",
      priority: "high",
      pilotId: VALID_UUID,
      droneId: VALID_UUID,
      latitude: "39.4699",
      longitude: "-6.3722",
      soraClass: "SAIL II",
      maxAltitude: 120,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields (just name)", () => {
    const result = missionCreateSchema.safeParse({
      name: "Mision minima",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = missionCreateSchema.safeParse({
      priority: "normal",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = missionCreateSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("defaults priority to normal", () => {
    const result = missionCreateSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("normal");
    }
  });

  it("accepts all 4 priority levels", () => {
    for (const p of ["low", "normal", "high", "urgent"]) {
      const result = missionCreateSchema.safeParse({ name: "Test", priority: p });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid priority", () => {
    const result = missionCreateSchema.safeParse({ name: "Test", priority: "critical" });
    expect(result.success).toBe(false);
  });

  it("converts empty optional strings to undefined", () => {
    const result = missionCreateSchema.safeParse({
      name: "Test",
      description: "",
      pilotId: "",
      droneId: "",
      soraClass: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.pilotId).toBeUndefined();
      expect(result.data.droneId).toBeUndefined();
      expect(result.data.soraClass).toBeUndefined();
    }
  });

  it("converts empty numeric strings to undefined", () => {
    const result = missionCreateSchema.safeParse({
      name: "Test",
      maxAltitude: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxAltitude).toBeUndefined();
    }
  });

  it("rejects negative altitude", () => {
    const result = missionCreateSchema.safeParse({
      name: "Test",
      maxAltitude: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for pilotId", () => {
    const result = missionCreateSchema.safeParse({
      name: "Test",
      pilotId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("Mission Update Schema", () => {
  it("requires id field", () => {
    const result = missionUpdateSchema.safeParse({
      name: "Updated name",
    });
    expect(result.success).toBe(false);
  });

  it("accepts partial updates with id", () => {
    const result = missionUpdateSchema.safeParse({
      id: VALID_UUID,
      name: "Updated name",
    });
    expect(result.success).toBe(true);
  });

  it("allows updating just priority", () => {
    const result = missionUpdateSchema.safeParse({
      id: VALID_UUID,
      priority: "urgent",
    });
    expect(result.success).toBe(true);
  });
});

describe("Mission Transition Schema", () => {
  it("accepts valid transition", () => {
    const result = missionTransitionSchema.safeParse({
      id: VALID_UUID,
      status: "planned",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all 8 status values", () => {
    const statuses = ["draft", "planned", "approved", "preflight", "in_flight", "completed", "aborted", "cancelled"];
    for (const s of statuses) {
      const result = missionTransitionSchema.safeParse({ id: VALID_UUID, status: s });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = missionTransitionSchema.safeParse({
      id: VALID_UUID,
      status: "flying",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = missionTransitionSchema.safeParse({
      status: "planned",
    });
    expect(result.success).toBe(false);
  });
});
