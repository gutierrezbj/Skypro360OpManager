"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/modules/notifications/auth.emails";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export type ForgotPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function requestPasswordResetAction(
  _prev: ForgotPasswordResult | null,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: "Email inválido" };
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Buscar usuario — pero NO revelamos si existe o no (anti-enumeration)
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user) {
    // Generar token random + hash. Solo guardamos el hash en BD.
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send email — no bloquea si falla SMTP, ya logea en consola
    try {
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetToken: rawToken,
      });
    } catch (err) {
      console.error("[forgot-password] email send failed:", err);
    }
  }

  // Mismo mensaje exista o no — protege contra enumeration
  return {
    success: true,
    message: "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en breve.",
  };
}
