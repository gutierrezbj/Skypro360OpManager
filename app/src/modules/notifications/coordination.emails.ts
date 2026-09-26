import { sendEmail } from "./email.service";
import { BODY_LABELS, type CoordinationBody } from "@/modules/coordinations/logic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://skp360mgr.systemrapid.io";
const LOGO_URL = `${APP_URL}/logo-skypro360.png`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type CoordinationReminderEmail = {
  to: string[];
  missionId: string;
  code: string;
  name: string;
  organismo: CoordinationBody;
  estado: string;
  limite: Date;
  fechaVuelo: Date;
  diasRestantes: number;
  umbral: number;
};

const fmt = (d: Date) =>
  d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

export async function sendCoordinationReminder(e: CoordinationReminderEmail): Promise<void> {
  if (e.to.length === 0) return;

  const organismo = BODY_LABELS[e.organismo];
  const urgente = e.diasRestantes <= 3;
  const color = e.diasRestantes < 0 ? "#dc2626" : urgente ? "#dc2626" : "#d97706";
  const headline =
    e.diasRestantes < 0
      ? `Plazo superado: ${organismo}`
      : e.diasRestantes === 0
        ? `Hoy vence el plazo: ${organismo}`
        : `Quedan ${e.diasRestantes} días para coordinar con ${organismo}`;
  const cta = `${APP_URL}/missions/${e.missionId}/compliance`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(headline)}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0f172a;padding:40px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
    <img src="${LOGO_URL}" alt="Skypro360" style="height:48px;width:auto;display:block;margin:0 auto 16px;">
    <div style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 16px;border-radius:100px;">
      Coordinación aeronáutica
    </div>
  </td></tr>
  <tr><td style="padding:32px 40px 8px;">
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">${escapeHtml(headline)}</h1>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">
      Operación <strong style="font-family:Menlo,Consolas,monospace;color:#0C9FD8;">${escapeHtml(e.code)}</strong> — ${escapeHtml(e.name)}
    </p>
  </td></tr>
  <tr><td style="padding:16px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
      <tr><td style="padding:14px 18px;font-size:13px;color:#334155;line-height:1.7;">
        <div><span style="color:#64748b;">Organismo:</span> <strong>${escapeHtml(organismo)}</strong></div>
        <div><span style="color:#64748b;">Estado actual:</span> <strong style="text-transform:capitalize;">${escapeHtml(e.estado)}</strong></div>
        <div><span style="color:#64748b;">Límite para tener la coordinación:</span> <strong style="color:${color};">${escapeHtml(fmt(e.limite))}</strong></div>
        <div><span style="color:#64748b;">Fecha de vuelo:</span> <strong>${escapeHtml(fmt(e.fechaVuelo))}</strong></div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:8px 40px 32px;text-align:center;">
    <a href="${cta}" style="display:inline-block;background:#0C9FD8;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">Abrir la operación</a>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;">Aviso automático a ${e.umbral} días del límite. Marca la coordinación como aprobada para dejar de recibirlos.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  await sendEmail({
    to: e.to,
    subject: `[${e.code}] ${headline}`,
    html,
  });
}
