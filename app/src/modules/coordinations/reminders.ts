import { eq, and, inArray } from "drizzle-orm";
import { db, withTenantContext } from "@/lib/db";
import { tenants, users, coordinationReminders } from "@/lib/db/schema";
import { getOpenCoordinationsWithMission } from "@/lib/db/queries/coordinations.queries";
import { sendCoordinationReminder } from "@/modules/notifications/coordination.emails";
import { evaluarCoordinacion, REMINDER_DAYS } from "./logic";

export type ReminderRunSummary = {
  tenants: number;
  evaluated: number;
  sent: number;
  skipped: number;
  errors: string[];
};

/**
 * Recorre todas las coordinaciones abiertas y envía el recordatorio del
 * umbral (10/5/3/1/0 días) más alto que ya se haya alcanzado y no se haya
 * enviado. Un email por coordinación y umbral; idempotente por
 * coordination_reminders(coordination_id, dias).
 */
export async function runCoordinationReminders(now: Date = new Date()): Promise<ReminderRunSummary> {
  const summary: ReminderRunSummary = { tenants: 0, evaluated: 0, sent: 0, skipped: 0, errors: [] };
  const tenantRows = await db.select({ id: tenants.id }).from(tenants);

  for (const { id: tenantId } of tenantRows) {
    summary.tenants++;
    try {
      await withTenantContext(tenantId, async (tx) => {
        const open = await getOpenCoordinationsWithMission(tenantId, tx);
        if (open.length === 0) return;

        const coordIds = open.map((r) => r.coordination.id);
        const sentRows = await tx
          .select({ coordinationId: coordinationReminders.coordinationId, dias: coordinationReminders.dias })
          .from(coordinationReminders)
          .where(and(eq(coordinationReminders.tenantId, tenantId), inArray(coordinationReminders.coordinationId, coordIds)));
        const sentSet = new Set(sentRows.map((r) => `${r.coordinationId}:${r.dias}`));

        const staff = await tx
          .select({ id: users.id, email: users.email, role: users.role })
          .from(users)
          .where(and(eq(users.tenantId, tenantId), inArray(users.role, ["org_admin", "coordinator"])));

        for (const r of open) {
          summary.evaluated++;
          const v = evaluarCoordinacion(r.coordination, r.mission.scheduledStart, now);
          if (!v.limite || v.diasRestantes === null) continue;

          // Umbral a enviar: el más bajo alcanzado (≤ diasRestantes) que no se haya enviado.
          // Si ya pasó un umbral sin enviarse (p.ej. coordinación creada tarde) se envía
          // el más pequeño pendiente y se marcan los mayores como enviados para no spamear.
          const reached = REMINDER_DAYS.filter((d) => v.diasRestantes! <= d);
          const pending = reached.filter((d) => !sentSet.has(`${r.coordination.id}:${d}`));
          if (pending.length === 0) { summary.skipped++; continue; }
          const umbral = Math.min(...pending);

          const to = new Set(staff.map((s) => s.email));
          if (r.mission.coordinatorId) {
            const [coord] = await tx.select({ email: users.email }).from(users).where(eq(users.id, r.mission.coordinatorId)).limit(1);
            if (coord?.email) to.add(coord.email);
          }

          await sendCoordinationReminder({
            to: [...to],
            missionId: r.mission.id,
            code: r.mission.code,
            name: r.mission.name,
            organismo: r.coordination.organismo,
            estado: r.coordination.estado,
            limite: v.limite,
            fechaVuelo: r.mission.scheduledStart!,
            diasRestantes: v.diasRestantes,
            umbral,
          });

          await tx.insert(coordinationReminders).values(
            pending.map((dias) => ({ tenantId, coordinationId: r.coordination.id, dias })),
          );
          summary.sent++;
        }
      });
    } catch (err) {
      summary.errors.push(`${tenantId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return summary;
}
