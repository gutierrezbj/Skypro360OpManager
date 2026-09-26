import { eq, and } from "drizzle-orm";
import { notFound, forbidden } from "next/navigation";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { missions, drones, pilots, users } from "@/lib/db/schema";
import { canUserAccessMission } from "@/lib/db/queries/missions.queries";
import { getCoordinationsForMission } from "@/lib/db/queries/coordinations.queries";
import { canManageCoordinations } from "@/lib/auth/rbac";
import {
  getPlanningForMission,
  getPreflightsForMission,
  getPostflightsForMission,
  getIncidentsForMission,
} from "@/modules/compliance/queries/compliance.queries";
import MissionCompliancePanel from "./MissionCompliancePanel";

export default async function MissionCompliancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const role = (session.user as { role: string }).role;

  const data = await withTenantContext(tenantId, async (tx) => {
    const [mission] = await tx
      .select()
      .from(missions)
      .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));
    if (!mission) return null;

    const allowed = await canUserAccessMission({ missionId: id, tenantId, userId, role }, tx);
    if (!allowed) return { forbidden: true as const };

    const [droneList, pilotList, userList, planning, preflights, postflights, incidents, coordinations] =
      await Promise.all([
        tx.select().from(drones).where(eq(drones.tenantId, tenantId)),
        tx.select().from(pilots).where(eq(pilots.tenantId, tenantId)),
        tx.select().from(users).where(eq(users.tenantId, tenantId)),
        getPlanningForMission(tenantId, id, tx),
        getPreflightsForMission(tenantId, id, tx),
        getPostflightsForMission(tenantId, id, tx),
        getIncidentsForMission(tenantId, id, tx),
        getCoordinationsForMission(tenantId, id, tx),
      ]);
    return { forbidden: false as const, mission, droneList, pilotList, userList, planning, preflights, postflights, incidents, coordinations };
  });

  if (!data) notFound();
  if (data.forbidden) {
    // Next.js 16: forbidden() renders forbidden.tsx (403) instead of notFound (404)
    if (typeof forbidden === "function") forbidden();
    notFound();
  }

  const { mission, droneList, pilotList, userList, planning, preflights, postflights, incidents, coordinations } = data;

  return (
    <MissionCompliancePanel
      mission={mission}
      drones={droneList}
      pilots={pilotList}
      users={userList}
      planning={planning}
      preflights={preflights}
      postflights={postflights}
      incidents={incidents}
      coordinations={coordinations}
      canManageCoordinations={canManageCoordinations(role)}
    />
  );
}
