import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { missions, drones, pilots, users, tenants } from "@/lib/db/schema";
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
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // Fetch mission
  const [mission] = await withTenantContext(tenantId, (tx) =>
    tx.select().from(missions).where(and(eq(missions.id, id), eq(missions.tenantId, tenantId))),
  );

  if (!mission) {
    return NextResponse.json({ error: "Mision no encontrada" }, { status: 404 });
  }

  // Fetch related data
  const [droneList, pilotList, userList, tenantList, planning, preflights, postflights, incidents] =
    await Promise.all([
      withTenantContext(tenantId, (tx) => tx.select().from(drones).where(eq(drones.tenantId, tenantId))),
      withTenantContext(tenantId, (tx) => tx.select().from(pilots).where(eq(pilots.tenantId, tenantId))),
      withTenantContext(tenantId, (tx) => tx.select().from(users).where(eq(users.tenantId, tenantId))),
      withTenantContext(tenantId, (tx) => tx.select().from(tenants).where(eq(tenants.id, tenantId))),
      getPlanningForMission(tenantId, id),
      getPreflightsForMission(tenantId, id),
      getPostflightsForMission(tenantId, id),
      getIncidentsForMission(tenantId, id),
    ]);

  const drone = droneList.find((d) => d.id === mission.droneId) ?? null;
  const pilot = pilotList.find((p) => p.id === mission.pilotId);
  const pilotUser = pilot ? userList.find((u) => u.id === pilot.userId) : null;
  const tenantName = tenantList[0]?.name ?? "OpsManager";

  const pdfBytes = await generateMissionDossierPdf({
    mission,
    drone,
    pilot: pilot && pilotUser ? { pilot, userName: pilotUser.name } : null,
    tenantName,
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
