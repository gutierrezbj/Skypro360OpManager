import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { drones, pilots, users } from "@/lib/db/schema";
import { getMissionsForUser } from "@/lib/db/queries/missions.queries";
import { canEditMission, canDeleteMission } from "@/lib/auth/rbac";
import MissionsPageClient from "./MissionsPageClient";

export default async function MissionsPage() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const role = (session.user as { role: string }).role;

  const [missionList, droneList, pilotList, userList] = await withTenantContext(tenantId, async (tx) => {
    const m = await getMissionsForUser({ tenantId, userId, role }, tx);

    const d = await tx.select().from(drones).where(eq(drones.tenantId, tenantId));

    const p = await tx
      .select({
        id: pilots.id,
        tenantId: pilots.tenantId,
        userId: pilots.userId,
        licenseNumber: pilots.licenseNumber,
        certificationStatus: pilots.certificationStatus,
        certificationExpiry: pilots.certificationExpiry,
        medicalExpiry: pilots.medicalExpiry,
        flightHours: pilots.flightHours,
        notes: pilots.notes,
        createdAt: pilots.createdAt,
        updatedAt: pilots.updatedAt,
        userName: users.name,
      })
      .from(pilots)
      .leftJoin(users, eq(pilots.userId, users.id))
      .where(eq(pilots.tenantId, tenantId));

    const u = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    return [m, d, p, u] as const;
  });

  return (
    <MissionsPageClient
      missions={missionList}
      drones={droneList}
      pilots={pilotList.map((p) => ({ ...p, userName: p.userName ?? undefined }))}
      users={userList}
      canEdit={canEditMission(role)}
      canDelete={canDeleteMission(role)}
    />
  );
}
