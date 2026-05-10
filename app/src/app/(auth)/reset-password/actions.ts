"use server";

import { z } from "zod";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { sendPasswordChangedEmail } from "@/modules/notifications/auth.emails";

const schema = z.object({
  token: z.string().min(10, "Token inválido"),
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden",
});

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function resetPasswordAction(
  _prev: ResetPasswordResult | null,
  formData: FormData,
): Promise<ResetPasswordResult> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
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

  const { token, newPassword } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Token válido = existe + no expirado + no usado
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date()),
    ))
    .limit(1);

  if (!resetToken) {
    return { success: false, error: "El enlace no es válido o ha caducado. Solicita uno nuevo." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, resetToken.userId)).limit(1);
  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  // Atomic-ish: actualizar password + marcar token como usado en transacción
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));
  });

  // Notificar por email (best-effort)
  try {
    await sendPasswordChangedEmail({ to: user.email, userName: user.name });
  } catch (err) {
    console.error("[reset-password] confirmation email failed:", err);
  }

  return { success: true };
}
