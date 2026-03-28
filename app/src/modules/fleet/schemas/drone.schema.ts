import { z } from "zod/v4";

/** Coerce empty strings to undefined for optional numeric/date fields from FormData */
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional(),
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().int().positive().optional(),
);

const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : new Date(v as string)),
  z.date().optional(),
);

const optionalString = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

export const droneCreateSchema = z.object({
  serialNumber: z.string().min(1, "Numero de serie requerido").max(100),
  model: z.string().min(1, "Modelo requerido").max(255),
  manufacturer: z.string().min(1, "Fabricante requerido").max(255),
  registrationNumber: optionalString,
  status: z.enum(["active", "maintenance", "retired", "pending_registration"]).default("pending_registration"),
  maxFlightTime: optionalInt,
  maxPayload: optionalNumber,
  category: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["open", "specific", "certified"]).optional(),
  ),
  easaClass: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["C0", "C1", "C2", "C3", "C4", "C5", "C6"]).optional(),
  ),
  mtomKg: optionalNumber,
  insuranceExpiry: optionalDate,
  specs: z.record(z.string(), z.unknown()).optional(),
});

export const droneUpdateSchema = droneCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const droneStatusChangeSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "maintenance", "retired", "pending_registration"]),
});

export type DroneCreateInput = z.infer<typeof droneCreateSchema>;
export type DroneUpdateInput = z.infer<typeof droneUpdateSchema>;
