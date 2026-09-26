import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { missions, drones, pilots, users, tenants } from "@/lib/db/schema";
import { canUserAccessMission } from "@/lib/db/queries/missions.queries";
import {
  getPlanningForMission,
  getPreflightsForMission,
  getPostflightsForMission,
  getIncidentsForMission,
} from "@/modules/compliance/queries/compliance.queries";
import { generateMissionDossierPdf } from "@/modules/reports/pdf-dossier";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireRole("admin", "org_admin", "coordinator", "pilot");
  const tenantId = session.user.tenantId;

  const data = await withTenantContext(tenantId, async (tx) => {
    const [mission] = await tx
      .select()
      .from(missions)
      .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));
    if (!mission) return null;

    const allowed = await canUserAccessMission(
      { missionId: id, tenantId, userId: session.user.id, role: session.user.role },
      tx,
    );
    if (!allowed) return null;

    const [droneList, pilotList, userList, tenantList, planning, preflights, postflights, incidents] =
      await Promise.all([
        tx.select().from(drones).where(eq(drones.tenantId, tenantId)),
        tx.select().from(pilots).where(eq(pilots.tenantId, tenantId)),
        tx.select().from(users).where(eq(users.tenantId, tenantId)),
        tx.select().from(tenants).where(eq(tenants.id, tenantId)),
        getPlanningForMission(tenantId, id, tx),
        getPreflightsForMission(tenantId, id, tx),
        getPostflightsForMission(tenantId, id, tx),
        getIncidentsForMission(tenantId, id, tx),
      ]);
    return { mission, droneList, pilotList, userList, tenantList, planning, preflights, postflights, incidents };
  });

  if (!data) {
    return NextResponse.json({ error: "Mision no encontrada" }, { status: 404 });
  }

  const { mission, droneList, pilotList, userList, tenantList, planning, preflights, postflights, incidents } = data;
  const drone = droneList.find((d) => d.id === mission.droneId) ?? null;
  const pilot = pilotList.find((p) => p.id === mission.pilotId);
  const pilotUser = pilot ? userList.find((u) => u.id === pilot.userId) : null;
  const tenant = tenantList[0];

  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 500 });
  }

  const pdfBytes = await generateMissionDossierPdf({
    mission,
    drone,
    pilot: pilot && pilotUser ? { pilot, userName: pilotUser.name } : null,
    tenant,
    planning,
    preflights,
    postflights,
    incidents,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${mission.code}-dossier.pdf"`,
    },
  });
}
