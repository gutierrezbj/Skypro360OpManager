import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { missions, drones, pilots, users } from "@/lib/db/schema";
import EspacioOpsClient from "./EspacioOpsClient";

export default async function EspacioOpsPage() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const [missionList, droneList, pilotList, userList] = await withTenantContext(tenantId, async (tx) => {
    const m = await tx.select().from(missions).where(eq(missions.tenantId, tenantId));
    const d = await tx.select().from(drones).where(eq(drones.tenantId, tenantId));
    const p = await tx.select().from(pilots).where(eq(pilots.tenantId, tenantId));
    const u = await tx.select().from(users).where(eq(users.tenantId, tenantId));
    return [m, d, p, u] as const;
  });

  const pilotsWithUser = pilotList.map((p) => ({
    ...p,
    userName: userList.find((u) => u.id === p.userId)?.name,
  }));

  const stats = {
    activeMissions:   missionList.filter((m) => ["in_flight", "preflight"].includes(m.status)).length,
    plannedMissions:  missionList.filter((m) => ["draft", "planned", "approved"].includes(m.status)).length,
    completedMissions: missionList.filter((m) => m.status === "completed").length,
    activeDrones:     droneList.filter((d) => d.status === "active").length,
    totalDrones:      droneList.length,
    validPilots:      pilotList.filter((p) => p.certificationStatus === "valid").length,
    totalPilots:      pilotList.length,
  };

  return (
    <EspacioOpsClient
      missions={missionList}
      drones={droneList}
      pilots={pilotsWithUser}
      stats={stats}
    />
  );
}
