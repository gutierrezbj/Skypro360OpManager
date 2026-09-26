import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { drones, pilots, users } from "@/lib/db/schema";
import { getMissionsForUser } from "@/lib/db/queries/missions.queries";
import { getOpenCoordinationsWithMission } from "@/lib/db/queries/coordinations.queries";
import { evaluarCoordinacion } from "@/modules/coordinations/logic";
import type { CoordinationAlert } from "@/modules/coordinations/components/PendingCoordinationsWidget";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const role = (session.user as { role: string }).role;

  const [missionList, droneList, pilotList, userList, openCoords] = await withTenantContext(tenantId, async (tx) => {
    const m = await getMissionsForUser({ tenantId, userId, role }, tx);
    const d = await tx.select().from(drones).where(eq(drones.tenantId, tenantId));
    const p = await tx.select().from(pilots).where(eq(pilots.tenantId, tenantId));
    const u = await tx.select().from(users).where(eq(users.tenantId, tenantId));
    const c = await getOpenCoordinationsWithMission(tenantId, tx);
    return [m, d, p, u, c] as const;
  });

  const visibleIds = new Set(missionList.map((m) => m.id));
  const coordinationAlerts: CoordinationAlert[] = openCoords
    .filter((r) => visibleIds.has(r.mission.id))
    .map((r) => {
      const v = evaluarCoordinacion(r.coordination, r.mission.scheduledStart);
      return v.limite && v.urgencia && v.diasRestantes !== null
        ? {
            missionId: r.mission.id,
            code: r.mission.code,
            name: r.mission.name,
            organismo: r.coordination.organismo,
            limite: v.limite.toISOString(),
            urgencia: v.urgencia,
            diasRestantes: v.diasRestantes,
          }
        : null;
    })
    .filter((a): a is CoordinationAlert => a !== null && a.urgencia !== "en_plazo")
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const pilotsWithUser = pilotList.map((p) => ({
    ...p,
    userName: userList.find((u) => u.id === p.userId)?.name,
  }));

  const stats = {
    totalMissions: missionList.length,
    activeMissions: missionList.filter((m) => ["in_flight", "preflight"].includes(m.status)).length,
    plannedMissions: missionList.filter((m) => ["draft", "planned", "approved"].includes(m.status)).length,
    completedMissions: missionList.filter((m) => m.status === "completed").length,
    totalDrones: droneList.length,
    activeDrones: droneList.filter((d) => d.status === "active").length,
    totalPilots: pilotList.length,
    validPilots: pilotList.filter((p) => p.certificationStatus === "valid").length,
  };

  return (
    <DashboardClient
      missions={missionList}
      stats={stats}
      pilots={pilotsWithUser}
      drones={droneList}
      coordinationAlerts={coordinationAlerts}
    />
  );
}
