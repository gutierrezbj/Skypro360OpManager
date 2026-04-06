import { describe, it, expect } from "vitest";
import { droneCreateSchema, droneUpdateSchema, droneStatusChangeSchema } from "@/modules/fleet/schemas/drone.schema";
import { pilotCreateSchema, pilotUpdateSchema } from "@/modules/fleet/schemas/pilot.schema";

// ── Drone schema ──────────────────────────────────────────────────────────────

describe("Drone Create Schema", () => {
  const valid = {
    serialNumber: "SN-DJI-M400-001",
    model: "Matrice 400",
    manufacturer: "DJI",
  };

  it("accepts minimal required fields", () => {
    const result = droneCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("defaults status to pending_registration", () => {
    const result = droneCreateSchema.safeParse(valid);
    expect(result.success && result.data.status).toBe("pending_registration");
  });

  it("accepts all valid statuses", () => {
    const statuses = ["active", "maintenance", "retired", "pending_registration"];
    for (const status of statuses) {
      const result = droneCreateSchema.safeParse({ ...valid, status });
      expect(result.success, `status ${status} should be valid`).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = droneCreateSchema.safeParse({ ...valid, status: "broken" });
    expect(result.success).toBe(false);
  });

  it("rejects missing serialNumber", () => {
    const result = droneCreateSchema.safeParse({ model: "X", manufacturer: "Y" });
    expect(result.success).toBe(false);
  });

  it("rejects empty serialNumber", () => {
    const result = droneCreateSchema.safeParse({ ...valid, serialNumber: "" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid EASA classes", () => {
    const classes = ["C0", "C1", "C2", "C3", "C4", "C5", "C6"];
    for (const easaClass of classes) {
      const result = droneCreateSchema.safeParse({ ...valid, easaClass });
      expect(result.success, `EASA class ${easaClass} should be valid`).toBe(true);
    }
  });

  it("rejects invalid EASA class", () => {
    const result = droneCreateSchema.safeParse({ ...valid, easaClass: "C9" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const categories = ["open", "specific", "certified"];
    for (const category of categories) {
      const result = droneCreateSchema.safeParse({ ...valid, category });
      expect(result.success, `category ${category} should be valid`).toBe(true);
    }
  });

  it("rejects negative maxPayload", () => {
    const result = droneCreateSchema.safeParse({ ...valid, maxPayload: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative maxFlightTime", () => {
    const result = droneCreateSchema.safeParse({ ...valid, maxFlightTime: -10 });
    expect(result.success).toBe(false);
  });

  it("coerces empty string maxPayload to undefined", () => {
    const result = droneCreateSchema.safeParse({ ...valid, maxPayload: "" });
    expect(result.success && result.data.maxPayload).toBeUndefined();
  });

  it("coerces empty string registrationNumber to undefined", () => {
    const result = droneCreateSchema.safeParse({ ...valid, registrationNumber: "" });
    expect(result.success && result.data.registrationNumber).toBeUndefined();
  });

  it("accepts full valid payload", () => {
    const result = droneCreateSchema.safeParse({
      ...valid,
      registrationNumber: "ES.UAS.2026.001",
      status: "active",
      maxFlightTime: 42,
      maxPayload: 2.5,
      category: "specific",
      easaClass: "C2",
      mtomKg: 8.5,
    });
    expect(result.success).toBe(true);
  });
});

describe("Drone Update Schema", () => {
  it("requires valid UUID id", () => {
    const result = droneUpdateSchema.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts partial update with id", () => {
    const result = droneUpdateSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      model: "Matrice 400 RTK",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with only id (all fields optional)", () => {
    const result = droneUpdateSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });
});

describe("Drone Status Change Schema", () => {
  it("requires valid UUID", () => {
    const result = droneStatusChangeSchema.safeParse({ id: "bad", status: "active" });
    expect(result.success).toBe(false);
  });

  it("accepts valid status change", () => {
    const result = droneStatusChangeSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "maintenance",
    });
    expect(result.success).toBe(true);
  });
});

// ── Pilot schema ──────────────────────────────────────────────────────────────

describe("Pilot Create Schema", () => {
  const validUserId = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts minimal required fields", () => {
    const result = pilotCreateSchema.safeParse({ userId: validUserId });
    expect(result.success).toBe(true);
  });

  it("defaults certificationStatus to pending", () => {
    const result = pilotCreateSchema.safeParse({ userId: validUserId });
    expect(result.success && result.data.certificationStatus).toBe("pending");
  });

  it("defaults flightHours to 0", () => {
    const result = pilotCreateSchema.safeParse({ userId: validUserId });
    expect(result.success && result.data.flightHours).toBe(0);
  });

  it("rejects invalid userId (not UUID)", () => {
    const result = pilotCreateSchema.safeParse({ userId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing userId", () => {
    const result = pilotCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts all valid certification statuses", () => {
    const statuses = ["valid", "expired", "suspended", "pending"];
    for (const certificationStatus of statuses) {
      const result = pilotCreateSchema.safeParse({ userId: validUserId, certificationStatus });
      expect(result.success, `status ${certificationStatus} should be valid`).toBe(true);
    }
  });

  it("rejects invalid certificationStatus", () => {
    const result = pilotCreateSchema.safeParse({ userId: validUserId, certificationStatus: "unknown" });
    expect(result.success).toBe(false);
  });

  it("rejects negative flightHours", () => {
    const result = pilotCreateSchema.safeParse({ userId: validUserId, flightHours: -5 });
    expect(result.success).toBe(false);
  });

  it("coerces empty licenseNumber to undefined", () => {
    const result = pilotCreateSchema.safeParse({ userId: validUserId, licenseNumber: "" });
    expect(result.success && result.data.licenseNumber).toBeUndefined();
  });

  it("accepts valid license number", () => {
    const result = pilotCreateSchema.safeParse({
      userId: validUserId,
      licenseNumber: "ESP-UAS-PIL-2024-1204",
      certificationStatus: "valid",
      flightHours: 250,
    });
    expect(result.success).toBe(true);
  });
});

describe("Pilot Update Schema", () => {
  it("requires valid UUID id", () => {
    const result = pilotUpdateSchema.safeParse({ id: "bad-id" });
    expect(result.success).toBe(false);
  });

  it("accepts partial update", () => {
    const result = pilotUpdateSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      certificationStatus: "valid",
    });
    expect(result.success).toBe(true);
  });
});
