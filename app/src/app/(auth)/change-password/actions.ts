"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const schema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual requerida"),
  newPassword: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .regex(/[A-Z]/, "Al menos una mayúscula")
    .regex(/[a-z]/, "Al menos una minúscula")
    .regex(/[0-9]/, "Al menos un número"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden",
});

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function changePasswordAction(
  _prev: ChangePasswordResult | null,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "No autenticado" };

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Validación fallida",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = session.user.id;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { success: false, error: "Usuario no encontrado" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: "Contraseña actual incorrecta" };

  // Evitar que se ponga la misma
  const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
  if (sameAsOld) return { success: false, error: "La nueva contraseña debe ser distinta de la actual" };

  const newHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}
