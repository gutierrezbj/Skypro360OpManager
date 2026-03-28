import { z } from "zod/v4";

const optionalString = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : new Date(v as string)),
  z.date().optional(),
);

export const pilotCreateSchema = z.object({
  userId: z.string().uuid("Usuario requerido"),
  licenseNumber: optionalString,
  certificationStatus: z.enum(["valid", "expired", "suspended", "pending"]).default("pending"),
  certificationExpiry: optionalDate,
  medicalExpiry: optionalDate,
  flightHours: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : Number(v)),
    z.number().min(0).default(0),
  ),
  notes: optionalString,
});

export const pilotUpdateSchema = pilotCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export type PilotCreateInput = z.infer<typeof pilotCreateSchema>;
export type PilotUpdateInput = z.infer<typeof pilotUpdateSchema>;
