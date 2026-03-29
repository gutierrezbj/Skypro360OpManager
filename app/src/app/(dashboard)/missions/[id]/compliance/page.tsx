import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { missions, drones, pilots, users } from "@/lib/db/schema";
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

  const [mission] = await withTenantContext(tenantId, async (tx) => {
    return tx
      .select()
      .from(missions)
      .where(and(eq(missions.id, id), eq(missions.tenantId, tenantId)));
  });

  if (!mission) notFound();

  const [droneList, pilotList, userList, planning, preflights, postflights, incidents] =
    await Promise.all([
      withTenantContext(tenantId, (tx) =>
        tx.select().from(drones).where(eq(drones.tenantId, tenantId)),
      ),
      withTenantContext(tenantId, (tx) =>
        tx.select().from(pilots).where(eq(pilots.tenantId, tenantId)),
      ),
      withTenantContext(tenantId, (tx) =>
        tx.select().from(users).where(eq(users.tenantId, tenantId)),
      ),
      getPlanningForMission(tenantId, id),
      getPreflightsForMission(tenantId, id),
      getPostflightsForMission(tenantId, id),
      getIncidentsForMission(tenantId, id),
    ]);

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
    />
  );
}
