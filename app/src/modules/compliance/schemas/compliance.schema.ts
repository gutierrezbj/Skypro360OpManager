import { z } from "zod";

const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().optional(),
);

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional(),
);

// --- Planning Form (Apéndice A.4) ---

export const planningFormSchema = z.object({
  missionId: z.string().uuid(),
  riskLevel: optionalString,
  weatherForecast: optionalString,
  operationType: optionalString,
  maxAltitude: optionalString,
  jsonData: z.any().optional(),
  signatureData: z.string().min(1, "Firma requerida"),
  rpApproved: z.preprocess((v) => v === "true" || v === true, z.boolean().default(false)),
  rpSignature: optionalString,
});

export type PlanningFormInput = z.infer<typeof planningFormSchema>;

// --- Preflight Form (Apéndice A.5/A.6) ---

export const preflightFormSchema = z.object({
  missionId: z.string().uuid(),
  uasId: optionalString,
  windSpeed: optionalNumber,
  temperature: optionalNumber,
  precipitation: optionalString,
  visibility: optionalString,
  airspaceStatus: optionalString,
  jsonData: z.any().optional(),
  signatureData: z.string().min(1, "Firma requerida"),
});

export type PreflightFormInput = z.infer<typeof preflightFormSchema>;

// --- Postflight Form (Apéndice A.7/A.8) ---

export const postflightFormSchema = z.object({
  missionId: z.string().uuid(),
  uasId: optionalString,
  batteryRemaining: optionalString,
  jsonData: z.any().optional(),
  signatureData: z.string().min(1, "Firma requerida"),
});

export type PostflightFormInput = z.infer<typeof postflightFormSchema>;

// --- Incident Form (Anexo I) ---

export const incidentFormSchema = z.object({
  missionId: z.string().uuid(),
  incidentType: z.enum([
    "none",                  // Declaracion formal "sin incidentes"
    "flyaway",
    "collision",
    "injury",
    "property_damage",
    "airspace_violation",
    "equipment_failure",
    "communication_loss",
    "battery_emergency",
    "weather_event",
    "other",
  ]),
  description: z.string().min(1, "Descripcion requerida"),
  actionsTaken: optionalString,
  aesaNotified: z.preprocess((v) => v === "true" || v === true, z.boolean().default(false)),
  jsonData: z.any().optional(),
  signatureData: z.string().min(1, "Firma requerida"),
});

export type IncidentFormInput = z.infer<typeof incidentFormSchema>;
