import { z } from "zod/v4";

const optionalInt = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().int().optional(),
);

const optionalText = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().max(255).optional(),
);

export const coordinationBodySchema = z.enum(["mi", "helipuerto", "aeropuerto", "defensa"]);
export const coordinationStatusSchema = z.enum(["pendiente", "enviada", "aprobada"]);

export const coordinationAddSchema = z.object({
  missionId: z.string().uuid(),
  organismo: coordinationBodySchema,
  diasHabiles: optionalInt,
});

export const coordinationUpdateSchema = z.object({
  id: z.string().uuid(),
  estado: coordinationStatusSchema.optional(),
  contacto: optionalText,
  diasHabiles: optionalInt,
});

export const coordinationRemoveSchema = z.object({
  id: z.string().uuid(),
});
