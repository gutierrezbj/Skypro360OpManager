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

const STATUS_COLORS: Record<MissionStatus, string> = {
  draft: "#9ca3af",
  planned: "#3b82f6",
  approved: "#6366f1",
  preflight: "#eab308",
  in_flight: "#10b981",
  completed: "#22c55e",
  aborted: "#ef4444",
  cancelled: "#6b7280",
};

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Skypro360</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">OpsManager</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              Este mensaje es autom&aacute;tico. No respondas a este email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function statusBadge(status: MissionStatus): string {
  const color = STATUS_COLORS[status] ?? "#9ca3af";
  const label = STATUS_LABELS[status] ?? status;
  return `<span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;">${label}</span>`;
}

function missionBlock(ctx: MissionEmailContext): string {
  const scheduled = ctx.scheduledStart
    ? new Date(ctx.scheduledStart).toLocaleString("es-ES", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;font-family:monospace;">${ctx.code}</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#0f172a;">${ctx.name}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:2px 0;color:#64748b;font-size:13px;width:120px;">Estado</td>
              <td style="padding:2px 0;">${statusBadge(ctx.newStatus)}</td>
            </tr>
            ${scheduled ? `
            <tr>
              <td style="padding:2px 0;color:#64748b;font-size:13px;">Programada</td>
              <td style="padding:2px 0;font-size:13px;color:#0f172a;">${scheduled}</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>`;
}

function ctaButton(text: string, url: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">${text}</a>
  </p>`;
}

const APP_URL = process.env.NEXTAUTH_URL ?? "https://skp360mgr.systemrapid.io";

/**
 * Fire-and-forget — call after a successful mission transition.
 * Does not await, does not throw.
 */
export function notifyMissionTransition(ctx: MissionEmailContext): void {
  // Run async without blocking
  _sendNotifications(ctx).catch(() => {
    // already handled inside sendEmail
  });
}

async function _sendNotifications(ctx: MissionEmailContext): Promise<void> {
  const { code, name, newStatus, pilotEmail, pilotName, coordinatorEmail, coordinatorName } = ctx;

  const missionUrl = `${APP_URL}/missions`;

  switch (newStatus) {
    case "approved": {
      if (pilotEmail) {
        await sendEmail({
          to: pilotEmail,
          subject: `[${code}] Misi\u00f3n aprobada — ${name}`,
          html: baseTemplate(`
            <p style="margin:0;font-size:16px;color:#0f172a;">Hola${pilotName ? ` ${pilotName}` : ""},</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              Has sido asignado como piloto a una misi\u00f3n que acaba de ser <strong>aprobada</strong>.
            </p>
            ${missionBlock(ctx)}
            <p style="color:#475569;font-size:14px;">
              Revisa los detalles y completa el checklist pre-vuelo antes de la operaci\u00f3n.
            </p>
            ${ctaButton("Ver misi\u00f3n", missionUrl)}
          `),
        });
      }
      break;
    }

    case "in_flight": {
      const recipients: { email: string; name?: string | null }[] = [];
      if (pilotEmail) recipients.push({ email: pilotEmail, name: pilotName });
      if (coordinatorEmail && coordinatorEmail !== pilotEmail)
        recipients.push({ email: coordinatorEmail, name: coordinatorName });

      for (const r of recipients) {
        await sendEmail({
          to: r.email,
          subject: `[${code}] \u{1F7E2} Vuelo iniciado — ${name}`,
          html: baseTemplate(`
            <p style="margin:0;font-size:16px;color:#0f172a;">Hola${r.name ? ` ${r.name}` : ""},</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              La misi\u00f3n ha <strong>iniciado vuelo</strong>.
            </p>
            ${missionBlock(ctx)}
            ${ctaButton("Seguimiento en tiempo real", missionUrl)}
          `),
        });
      }
      break;
    }

    case "completed": {
      const recipients: { email: string; name?: string | null }[] = [];
      if (pilotEmail) recipients.push({ email: pilotEmail, name: pilotName });
      if (coordinatorEmail && coordinatorEmail !== pilotEmail)
        recipients.push({ email: coordinatorEmail, name: coordinatorName });

      for (const r of recipients) {
        await sendEmail({
          to: r.email,
          subject: `[${code}] Misi\u00f3n completada — ${name}`,
          html: baseTemplate(`
            <p style="margin:0;font-size:16px;color:#0f172a;">Hola${r.name ? ` ${r.name}` : ""},</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              La misi\u00f3n ha sido <strong>completada con \u00e9xito</strong>.
            </p>
            ${missionBlock(ctx)}
            <p style="color:#475569;font-size:14px;">
              Recuerda completar el informe post-vuelo y los formularios de compliance AESA.
            </p>
            ${ctaButton("Ver compliance", missionUrl)}
          `),
        });
      }
      break;
    }

    case "aborted": {
      const recipients: { email: string; name?: string | null }[] = [];
      if (pilotEmail) recipients.push({ email: pilotEmail, name: pilotName });
      if (coordinatorEmail && coordinatorEmail !== pilotEmail)
        recipients.push({ email: coordinatorEmail, name: coordinatorName });

      for (const r of recipients) {
        await sendEmail({
          to: r.email,
          subject: `[${code}] \u26a0\ufe0f Misi\u00f3n abortada — ${name}`,
          html: baseTemplate(`
            <p style="margin:0;font-size:16px;color:#0f172a;">Hola${r.name ? ` ${r.name}` : ""},</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              La misi\u00f3n ha sido <strong>abortada</strong>. Es necesario registrar el incidente en el sistema.
            </p>
            ${missionBlock(ctx)}
            ${ctaButton("Registrar incidente", missionUrl)}
          `),
        });
      }
      break;
    }

    case "cancelled": {
      if (pilotEmail) {
        await sendEmail({
          to: pilotEmail,
          subject: `[${code}] Misi\u00f3n cancelada — ${name}`,
          html: baseTemplate(`
            <p style="margin:0;font-size:16px;color:#0f172a;">Hola${pilotName ? ` ${pilotName}` : ""},</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              La misi\u00f3n en la que estabas asignado ha sido <strong>cancelada</strong>.
            </p>
            ${missionBlock(ctx)}
          `),
        });
      }
      break;
    }
  }
}
