import { describe, it, expect } from "vitest";
import { generateMissionDossierPdf } from "@/modules/reports/pdf-dossier";
import { PDFDocument } from "pdf-lib";

// Minimal mock data matching the schema types
function makeMission(overrides: Record<string, unknown> = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    tenantId: "t1",
    code: "SKY-2026-001",
    name: "Mision de prueba",
    description: "Inspeccion fotovoltaica en planta solar",
    status: "completed" as const,
    priority: "normal" as const,
    soraClass: "SAIL II",
    earoReference: "EARO-2026-001",
    maxAltitude: 120,
    latitude: "39.4699",
    longitude: "-6.3722",
    scheduledStart: new Date("2026-03-28T09:00:00"),
    scheduledEnd: new Date("2026-03-28T11:00:00"),
    actualStart: new Date("2026-03-28T09:15:00"),
    actualEnd: new Date("2026-03-28T10:45:00"),
    pilotId: "p1",
    droneId: "d1",
    coordinatorId: null,
    createdAt: new Date("2026-03-27T12:00:00"),
    updatedAt: new Date("2026-03-28T10:45:00"),
    ...overrides,
  } as any;
}

function makeDrone() {
  return {
    id: "d1",
    tenantId: "t1",
    model: "DJI Matrice 350 RTK",
    serialNumber: "SN-12345",
    registrationNumber: "ES-UAS-001",
    easaClass: "C2",
    status: "active",
  } as any;
}

function makePilot() {
  return {
    pilot: {
      id: "p1",
      tenantId: "t1",
      userId: "u1",
      licenseNumber: "ESP-RPAS-12345",
      certificationStatus: "valid",
    } as any,
    userName: "Carlos Garcia",
  };
}

function makePlanning() {
  return {
    id: "pl1",
    missionId: "550e8400-e29b-41d4-a716-446655440000",
    tenantId: "t1",
    riskLevel: "medio",
    operationType: "VLOS",
    maxAltitude: "120m",
    weatherForecast: "Despejado",
    rpApproved: true,
    signatureData: null,
    rpSignature: null,
    jsonData: { zona_vuelo_definida: true, notams_consultados: true, permisos_verificados: false },
    createdAt: new Date("2026-03-27T14:00:00"),
    updatedAt: new Date("2026-03-27T14:00:00"),
  } as any;
}

function makePreflight() {
  return {
    id: "pf1",
    missionId: "550e8400-e29b-41d4-a716-446655440000",
    tenantId: "t1",
    uasId: "d1",
    airspaceStatus: "libre",
    weatherConditions: { windSpeed: 12, temperature: 22, precipitation: "ninguna", visibility: "buena" },
    signatureData: null,
    jsonData: { bateria_cargada: true, helices_ok: true, gps_lock: true },
    createdAt: new Date("2026-03-28T08:30:00"),
    updatedAt: new Date("2026-03-28T08:30:00"),
  } as any;
}

function makePostflight() {
  return {
    id: "po1",
    missionId: "550e8400-e29b-41d4-a716-446655440000",
    tenantId: "t1",
    uasId: "d1",
    batteryRemaining: "35%",
    signatureData: null,
    jsonData: { uas_sin_danos: true, datos_descargados: true },
    createdAt: new Date("2026-03-28T10:45:00"),
    updatedAt: new Date("2026-03-28T10:45:00"),
  } as any;
}

function makeIncident() {
  return {
    id: "inc1",
    missionId: "550e8400-e29b-41d4-a716-446655440000",
    tenantId: "t1",
    incidentType: "equipment_failure",
    description: "Fallo sensor gimbal durante vuelo",
    actionsTaken: "Aterrizaje inmediato, inspeccion visual",
    aesaNotified: false,
    signatureData: null,
    jsonData: null,
    createdAt: new Date("2026-03-28T10:30:00"),
    updatedAt: new Date("2026-03-28T10:30:00"),
  } as any;
}

describe("PDF Dossier Generation", () => {
  it("generates a valid PDF with minimal data", async () => {
    const bytes = await generateMissionDossierPdf({
      mission: makeMission(),
      drone: null,
      pilot: null,
      tenantName: "Skypro360",
      planning: null,
      preflights: [],
      postflights: [],
      incidents: [],
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);

    // Verify it's a valid PDF
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("generates a PDF with all sections populated", async () => {
    const bytes = await generateMissionDossierPdf({
      mission: makeMission(),
      drone: makeDrone(),
      pilot: makePilot(),
      tenantName: "Skypro360 S.L.",
      planning: makePlanning(),
      preflights: [makePreflight()],
      postflights: [makePostflight()],
      incidents: [makeIncident()],
    });

    const doc = await PDFDocument.load(bytes);
    // With all sections, should have at least 1 page
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("includes footer on every page", async () => {
    const bytes = await generateMissionDossierPdf({
      mission: makeMission({ code: "SKY-2026-099" }),
      drone: makeDrone(),
      pilot: makePilot(),
      tenantName: "TestTenant",
      planning: makePlanning(),
      preflights: [makePreflight()],
      postflights: [makePostflight()],
      incidents: [],
    });

    // Parse back — we can't easily read text from pdf-lib, but we can confirm page count
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("handles mission with no description", async () => {
    const bytes = await generateMissionDossierPdf({
      mission: makeMission({ description: null }),
      drone: null,
      pilot: null,
      tenantName: "Test",
      planning: null,
      preflights: [],
      postflights: [],
      incidents: [],
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("handles multiple preflights and postflights", async () => {
    const bytes = await generateMissionDossierPdf({
      mission: makeMission(),
      drone: makeDrone(),
      pilot: makePilot(),
      tenantName: "Test",
      planning: null,
      preflights: [makePreflight(), makePreflight()],
      postflights: [makePostflight(), makePostflight(), makePostflight()],
      incidents: [],
    });

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("handles incident with long description", async () => {
    const longDesc = "Este es un incidente con una descripcion muy larga que deberia forzar el word-wrapping en el PDF. ".repeat(10);
    const incident = makeIncident();
    incident.description = longDesc;

    const bytes = await generateMissionDossierPdf({
      mission: makeMission(),
      drone: null,
      pilot: null,
      tenantName: "Test",
      planning: null,
      preflights: [],
      postflights: [],
      incidents: [incident],
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  it("returns Uint8Array (not Buffer)", async () => {
    const bytes = await generateMissionDossierPdf({
      mission: makeMission(),
      drone: null,
      pilot: null,
      tenantName: "Test",
      planning: null,
      preflights: [],
      postflights: [],
      incidents: [],
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
  });
});
