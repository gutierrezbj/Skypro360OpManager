/**
 * Auth-related email templates (password reset, etc.)
 * Cockpit-styled HTML — funciona en clientes oscuros y claros.
 */

import { sendEmail } from "./email.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://skp360mgr.systemrapid.io";

function baseTemplate(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080D14;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080D14;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#0D1520;border:1px solid #1E3A5F;border-radius:14px;overflow:hidden;max-width:560px;">
        <tr><td style="padding:24px 32px 18px;border-bottom:1px solid #162338;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#0C9FD8;">SKYPRO360 · OPSMANAGER</div>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#D6E8F5;letter-spacing:0.02em;">${opts.title}</h1>
        </td></tr>
        <tr><td style="padding:24px 32px;color:#D6E8F5;font-size:14px;line-height:1.6;">
          ${opts.bodyHtml}
          ${opts.ctaUrl && opts.ctaLabel ? `
            <div style="margin:28px 0 12px;">
              <a href="${opts.ctaUrl}" style="display:inline-block;background:#0C9FD8;color:#080D14;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;letter-spacing:0.05em;font-size:13px;">${opts.ctaLabel}</a>
            </div>
            <p style="margin:18px 0 0;font-size:11px;color:#6BA3C0;line-height:1.5;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <span style="color:#0C9FD8;word-break:break-all;font-family:ui-monospace,monospace;">${opts.ctaUrl}</span>
            </p>
          ` : ""}
          ${opts.footerNote ? `<p style="margin:24px 0 0;padding:14px;background:rgba(245,197,24,0.08);border:1px solid rgba(245,197,24,0.25);border-radius:8px;font-size:12px;color:#F5C518;line-height:1.5;">${opts.footerNote}</p>` : ""}
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #162338;text-align:center;">
          <div style="font-size:10px;color:#243A52;letter-spacing:0.15em;text-transform:uppercase;">Skypro360 OpsManager · SRS</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(args: {
  to: string;
  userName: string;
  resetToken: string;
}) {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(args.resetToken)}`;

  const html = baseTemplate({
    title: "Restablecer contraseña",
    preheader: "Solicitud de cambio de contraseña en OpsManager",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hola <strong style="color:#0C9FD8;">${args.userName}</strong>,</p>
      <p style="margin:0 0 12px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en OpsManager.</p>
      <p style="margin:0;">Pulsa el botón para crear una nueva contraseña. El enlace caduca en <strong>1 hora</strong>.</p>
    `,
    ctaLabel: "RESTABLECER CONTRASEÑA",
    ctaUrl: url,
    footerNote: "Si no fuiste tú quien solicitó este cambio, ignora este correo. Tu contraseña actual seguirá siendo válida.",
  });

  await sendEmail({
    to: args.to,
    subject: "OpsManager — Restablecer contraseña",
    html,
  });
}

export async function sendPasswordChangedEmail(args: {
  to: string;
  userName: string;
}) {
  const html = baseTemplate({
    title: "Contraseña actualizada",
    preheader: "Tu contraseña en OpsManager se ha cambiado correctamente",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hola <strong style="color:#0C9FD8;">${args.userName}</strong>,</p>
      <p style="margin:0 0 12px;">Te confirmamos que tu contraseña de OpsManager se ha cambiado correctamente.</p>
      <p style="margin:0;">Si no fuiste tú, contacta inmediatamente con el administrador de tu organización.</p>
    `,
    ctaLabel: "ACCEDER A OPSMANAGER",
    ctaUrl: `${APP_URL}/login`,
  });

  await sendEmail({
    to: args.to,
    subject: "OpsManager — Contraseña actualizada",
    html,
  });
}
