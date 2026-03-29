import { describe, it, expect } from "vitest";
import {
  planningFormSchema,
  preflightFormSchema,
  postflightFormSchema,
  incidentFormSchema,
} from "@/modules/compliance/schemas/compliance.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("Planning Form Schema (A.4)", () => {
  it("accepts valid complete data", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
      riskLevel: "alto",
      weatherForecast: "Despejado, viento <15km/h",
      operationType: "VLOS",
      maxAltitude: "120",
      signatureData: VALID_SIGNATURE,
      rpApproved: true,
      rpSignature: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing missionId", () => {
    const result = planningFormSchema.safeParse({
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for missionId", () => {
    const result = planningFormSchema.safeParse({
      missionId: "not-a-uuid",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing signature", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty signature", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: "",
    });
    expect(result.success).toBe(false);
  });

  it("coerces rpApproved string 'true' to boolean", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
      rpApproved: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rpApproved).toBe(true);
    }
  });

  it("coerces rpApproved string 'false' to false", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
      rpApproved: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rpApproved).toBe(false);
    }
  });

  it("converts empty optional strings to undefined", () => {
    const result = planningFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
      riskLevel: "",
      weatherForecast: "",
      operationType: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskLevel).toBeUndefined();
      expect(result.data.weatherForecast).toBeUndefined();
      expect(result.data.operationType).toBeUndefined();
    }
  });
});

describe("Preflight Form Schema (A.5/A.6)", () => {
  it("accepts valid complete data", () => {
    const result = preflightFormSchema.safeParse({
      missionId: VALID_UUID,
      uasId: VALID_UUID,
      windSpeed: 12,
      temperature: 22,
      precipitation: "ninguna",
      visibility: "buena",
      airspaceStatus: "libre",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields", () => {
    const result = preflightFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers to numeric", () => {
    const result = preflightFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
      windSpeed: "15",
      temperature: "28",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.windSpeed).toBe(15);
      expect(result.data.temperature).toBe(28);
    }
  });

  it("converts empty numeric strings to undefined", () => {
    const result = preflightFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
      windSpeed: "",
      temperature: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.windSpeed).toBeUndefined();
      expect(result.data.temperature).toBeUndefined();
    }
  });
});

describe("Postflight Form Schema (A.7/A.8)", () => {
  it("accepts valid complete data", () => {
    const result = postflightFormSchema.safeParse({
      missionId: VALID_UUID,
      uasId: VALID_UUID,
      batteryRemaining: "45%",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields", () => {
    const result = postflightFormSchema.safeParse({
      missionId: VALID_UUID,
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing signature", () => {
    const result = postflightFormSchema.safeParse({
      missionId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });
});

describe("Incident Form Schema (Anexo I)", () => {
  it("accepts valid complete data", () => {
    const result = incidentFormSchema.safeParse({
      missionId: VALID_UUID,
      incidentType: "flyaway",
      description: "Drone perdio control durante ascenso",
      actionsTaken: "Aterrizaje forzoso activado",
      aesaNotified: true,
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all 10 incident types", () => {
    const types = [
      "flyaway", "collision", "injury", "property_damage", "airspace_violation",
      "equipment_failure", "communication_loss", "battery_emergency", "weather_event", "other",
    ];
    for (const type of types) {
      const result = incidentFormSchema.safeParse({
        missionId: VALID_UUID,
        incidentType: type,
        description: "Test",
        signatureData: VALID_SIGNATURE,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid incident type", () => {
    const result = incidentFormSchema.safeParse({
      missionId: VALID_UUID,
      incidentType: "explosion",
      description: "Test",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = incidentFormSchema.safeParse({
      missionId: VALID_UUID,
      incidentType: "flyaway",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = incidentFormSchema.safeParse({
      missionId: VALID_UUID,
      incidentType: "collision",
      description: "",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(false);
  });

  it("coerces aesaNotified string to boolean", () => {
    const result = incidentFormSchema.safeParse({
      missionId: VALID_UUID,
      incidentType: "injury",
      description: "Lesion menor operario",
      signatureData: VALID_SIGNATURE,
      aesaNotified: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aesaNotified).toBe(true);
    }
  });

  it("defaults aesaNotified to false", () => {
    const result = incidentFormSchema.safeParse({
      missionId: VALID_UUID,
      incidentType: "other",
      description: "Incidente menor",
      signatureData: VALID_SIGNATURE,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aesaNotified).toBe(false);
    }
  });
});
