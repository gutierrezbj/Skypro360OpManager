import { z } from "zod/v4";

const optionalString = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : new Date(v as string)),
  z.date().optional(),
);

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional(),
);

export const missionCreateSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(255),
  description: optionalString,
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  pilotId: z.preprocess((v) => (v === "" ? undefined : v), z.string().uuid().optional()),
  droneId: z.preprocess((v) => (v === "" ? undefined : v), z.string().uuid().optional()),
  coordinatorId: z.preprocess((v) => (v === "" ? undefined : v), z.string().uuid().optional()),
  latitude: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.string().optional(),
  ),
  longitude: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.string().optional(),
  ),
  scheduledStart: optionalDate,
  scheduledEnd: optionalDate,
  soraClass: optionalString,
  earoReference: optionalString,
  maxAltitude: optionalNumber,
});

export const missionUpdateSchema = missionCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const missionTransitionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "planned", "approved", "preflight", "in_flight", "completed", "aborted", "cancelled"]),
});

export type MissionCreateInput = z.infer<typeof missionCreateSchema>;
export type MissionUpdateInput = z.infer<typeof missionUpdateSchema>;
