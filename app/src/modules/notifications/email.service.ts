/**
 * Email notification service — Google Workspace SMTP via App Password
 *
 * Config (.env):
 *   SMTP_FROM=ops@systemrapid.io       ← alias visible en el from
 *   SMTP_AUTH_USER=juang@systemrapid.io ← cuenta real que autentica
 *   SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *
 * Nota: los alias de Google Workspace no pueden autenticar SMTP directamente.
 * Se autentica con la cuenta principal y se envía desde el alias.
 */

import nodemailer from "nodemailer";

const FROM = process.env.SMTP_FROM ?? "";
const AUTH_USER = process.env.SMTP_AUTH_USER || FROM; // fallback a FROM si no hay auth user
const APP_PASSWORD = process.env.SMTP_APP_PASSWORD ?? "";

function createTransport() {
  if (!FROM || !APP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: AUTH_USER, pass: APP_PASSWORD },
  });
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    console.warn("[email] SMTP not configured — skipping email");
    return;
  }
  try {
    await transport.sendMail({
      from: `Skypro360 OpsManager <${FROM}>`,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    // Never throw — email failure must not block mission transitions
    console.error("[email] Send failed:", err instanceof Error ? err.message : err);
  }
}
