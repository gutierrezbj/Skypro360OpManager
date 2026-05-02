/**
 * Mission email templates + notification dispatcher
 *
 * Sends emails on relevant status transitions:
 *   approved    → piloto asignado
 *   in_flight   → piloto + coordinador
 *   completed   → piloto + coordinador
 *   aborted     → piloto + coordinador
 *   cancelled   → piloto (si asignado)
 */

import { sendEmail } from "./email.service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://skp360mgr.systemrapid.io";
const LOGO_URL = `${APP_URL}/logo-skypro360.png`;

type MissionStatus =
  | "draft" | "planned" | "approved" | "preflight"
  | "in_flight" | "completed" | "aborted" | "cancelled";

interface MissionEmailContext {
  code: string;
  name: string;
  oldStatus: MissionStatus;
  newStatus: MissionStatus;
  pilotEmail?: string | null;
  pilotName?: string | null;
  coordinatorEmail?: string | null;
  coordinatorName?: string | null;
  scheduledStart?: Date | null;
}

const STATUS_LABELS: Record<MissionStatus, string> = {
  draft: "Borrador",
  planned: "Planificada",
  approved: "Aprobada",
  preflight: "Pre-vuelo",
  in_flight: "En vuelo",
  completed: "Completada",
  aborted: "Abortada",
  cancelled: "Cancelada",
};

// Status accent colors
const STATUS_META: Record<MissionStatus, { color: string; bg: string; icon: string }> = {
  draft:      { color: "#6b7280", bg: "#f3f4f6", icon: "&#9711;" },
  planned:    { color: "#2563eb", bg: "#eff6ff", icon: "&#128336;" },
  approved:   { color: "#7c3aed", bg: "#f5f3ff", icon: "&#10003;" },
  preflight:  { color: "#d97706", bg: "#fffbeb", icon: "&#9997;" },
  in_flight:  { color: "#059669", bg: "#ecfdf5", icon: "&#9992;" },
  completed:  { color: "#16a34a", bg: "#f0fdf4", icon: "&#9989;" },
  aborted:    { color: "#dc2626", bg: "#fef2f2", icon: "&#9888;" },
  cancelled:  { color: "#6b7280", bg: "#f9fafb", icon: "&#10005;" },
};

function baseTemplate({
  status,
  headline,
  recipientName,
  missionCode,
  missionName,
  scheduledStart,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  status: MissionStatus;
  headline: string;
  recipientName?: string | null;
  missionCode: string;
  missionName: string;
  scheduledStart?: Date | null;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const meta = STATUS_META[status];
  const label = STATUS_LABELS[status];

  const scheduled = scheduledStart
    ? new Date(scheduledStart).toLocaleString("es-ES", {
        weekday: "long", day: "2-digit", month: "long",
        year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%);min-height:100vh;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);">

        <!-- ── HEADER HERO ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);padding:40px 40px 32px;text-align:center;position:relative;">

            <!-- Grid texture overlay (inline SVG background) -->
            <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 40px);pointer-events:none;border-radius:20px 20px 0 0;"></div>

            <!-- Logo -->
            <img src="${LOGO_URL}" alt="Skypro360"
                 style="height:52px;width:auto;display:block;margin:0 auto 20px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));">

            <!-- Status badge -->
            <div style="display:inline-block;background:${meta.color};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 16px;border-radius:100px;margin-bottom:16px;">
              ${meta.icon}&nbsp;&nbsp;${label}
            </div>

            <!-- Headline -->
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
              ${headline}
            </h1>

            <!-- Greeting -->
            ${recipientName ? `<p style="margin:10px 0 0;color:#94a3b8;font-size:14px;">Para&nbsp;<strong style="color:#e2e8f0;">${recipientName}</strong></p>` : ""}
          </td>
        </tr>

        <!-- ── MISSION CARD ── -->
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:${meta.bg};border:1.5px solid ${meta.color}22;border-radius:14px;margin-top:-1px;overflow:hidden;">
              <!-- Color bar -->
              <tr><td style="height:4px;background:linear-gradient(90deg,${meta.color},${meta.color}88);"></td></tr>
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${meta.color};font-family:monospace;">${missionCode}</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;line-height:1.3;">${missionName}</p>
                  ${scheduled ? `
                  <p style="margin:10px 0 0;font-size:13px;color:#64748b;">
                    <span style="display:inline-block;background:#e2e8f0;border-radius:6px;padding:3px 10px;font-weight:600;">
                      &#128197;&nbsp;${scheduled}
                    </span>
                  </p>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:28px 40px 8px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- ── CTA BUTTON ── -->
        <tr>
          <td style="padding:8px 40px 36px;text-align:center;">
            <a href="${ctaUrl}"
               style="display:inline-block;background:linear-gradient(135deg,${meta.color},${meta.color}cc);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 15px ${meta.color}44;">
              ${ctaLabel} &nbsp;&#8594;
            </a>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding:24px 40px;text-align:center;background:#f8fafc;">
            <img src="${LOGO_URL}" alt="Skypro360" style="height:28px;width:auto;opacity:0.5;margin-bottom:10px;display:block;margin:0 auto 10px;">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
              Skypro360 OpsManager &mdash; Sistema de Gesti&oacute;n de Operaciones UAS<br>
              Este mensaje es autom&aacute;tico. No respondas a este correo.
            </p>
            <p style="margin:8px 0 0;">
              <a href="${APP_URL}" style="color:#6366f1;font-size:11px;text-decoration:none;font-weight:600;">skp360mgr.systemrapid.io</a>
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>

</body>
</html>`;
}

function bodyText(lines: string[]): string {
  return lines.map(line =>
    `<p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.65;">${line}</p>`
  ).join("");
}

// ─────────────────────────────────────────
// Public dispatcher — fire-and-forget
// ─────────────────────────────────────────

export function notifyMissionTransition(ctx: MissionEmailContext): void {
  _sendNotifications(ctx).catch(() => {});
}

async function _sendNotifications(ctx: MissionEmailContext): Promise<void> {
  const { code, name, newStatus, pilotEmail, pilotName, coordinatorEmail, coordinatorName, scheduledStart } = ctx;
  const missionsUrl = `${APP_URL}/missions`;

  switch (newStatus) {

    case "approved": {
      if (pilotEmail) {
        await sendEmail({
          to: pilotEmail,
          subject: `✅ [${code}] Misión aprobada — ${name}`,
          html: baseTemplate({
            status: "approved",
            headline: "Misión aprobada",
            recipientName: pilotName,
            missionCode: code,
            missionName: name,
            scheduledStart,
            bodyHtml: bodyText([
              `Has sido asignado como piloto a esta misi&oacute;n, que acaba de recibir la <strong>aprobaci&oacute;n operacional</strong>.`,
              `Revisa los detalles, confirma tu disponibilidad y prepara el checklist pre-vuelo antes de la operaci&oacute;n.`,
            ]),
            ctaLabel: "Ver misión",
            ctaUrl: missionsUrl,
          }),
        });
      }
      break;
    }

    case "in_flight": {
      const recipients = buildRecipients(pilotEmail, pilotName, coordinatorEmail, coordinatorName);
      for (const r of recipients) {
        await sendEmail({
          to: r.email,
          subject: `🟢 [${code}] Vuelo iniciado — ${name}`,
          html: baseTemplate({
            status: "in_flight",
            headline: "Vuelo en progreso",
            recipientName: r.name,
            missionCode: code,
            missionName: name,
            scheduledStart,
            bodyHtml: bodyText([
              `La misi&oacute;n ha <strong>iniciado vuelo</strong> correctamente.`,
              `El sistema est&aacute; registrando telemetr&iacute;a en tiempo real. Puedes seguir el progreso desde el mapa de operaciones.`,
            ]),
            ctaLabel: "Seguimiento en tiempo real",
            ctaUrl: missionsUrl,
          }),
        });
      }
      break;
    }

    case "completed": {
      const recipients = buildRecipients(pilotEmail, pilotName, coordinatorEmail, coordinatorName);
      for (const r of recipients) {
        await sendEmail({
          to: r.email,
          subject: `✅ [${code}] Misión completada — ${name}`,
          html: baseTemplate({
            status: "completed",
            headline: "Misión completada con éxito",
            recipientName: r.name,
            missionCode: code,
            missionName: name,
            scheduledStart,
            bodyHtml: bodyText([
              `La misi&oacute;n ha sido <strong>completada satisfactoriamente</strong>. ¡Buen trabajo!`,
              `Recuerda completar el <strong>informe post-vuelo</strong> y los formularios de compliance AESA (Ap&eacute;ndices A.7 y A.8) para cerrar el expediente operacional.`,
            ]),
            ctaLabel: "Completar compliance AESA",
            ctaUrl: missionsUrl,
          }),
        });
      }
      break;
    }

    case "aborted": {
      const recipients = buildRecipients(pilotEmail, pilotName, coordinatorEmail, coordinatorName);
      for (const r of recipients) {
        await sendEmail({
          to: r.email,
          subject: `⚠️ [${code}] Misión abortada — ${name}`,
          html: baseTemplate({
            status: "aborted",
            headline: "Misión abortada",
            recipientName: r.name,
            missionCode: code,
            missionName: name,
            scheduledStart,
            bodyHtml: bodyText([
              `La misi&oacute;n ha sido <strong>abortada durante la operaci&oacute;n</strong>.`,
              `Es obligatorio registrar el incidente en el sistema de compliance AESA y documentar las causas del abandono seg&uacute;n el protocolo establecido.`,
            ]),
            ctaLabel: "Registrar incidente",
            ctaUrl: missionsUrl,
          }),
        });
      }
      break;
    }

    case "cancelled": {
      if (pilotEmail) {
        await sendEmail({
          to: pilotEmail,
          subject: `[${code}] Misión cancelada — ${name}`,
          html: baseTemplate({
            status: "cancelled",
            headline: "Misión cancelada",
            recipientName: pilotName,
            missionCode: code,
            missionName: name,
            scheduledStart,
            bodyHtml: bodyText([
              `La misi&oacute;n en la que estabas asignado ha sido <strong>cancelada</strong>.`,
              `Si tienes dudas sobre esta decisi&oacute;n, contacta con tu coordinador de operaciones.`,
            ]),
            ctaLabel: "Ver misiones",
            ctaUrl: missionsUrl,
          }),
        });
      }
      break;
    }
  }
}

function buildRecipients(
  pilotEmail?: string | null,
  pilotName?: string | null,
  coordinatorEmail?: string | null,
  coordinatorName?: string | null,
): { email: string; name?: string | null }[] {
  const out: { email: string; name?: string | null }[] = [];
  if (pilotEmail) out.push({ email: pilotEmail, name: pilotName });
  if (coordinatorEmail && coordinatorEmail !== pilotEmail)
    out.push({ email: coordinatorEmail, name: coordinatorName });
  return out;
}
