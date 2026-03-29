import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { missions, drones, pilots, users } from "@/lib/db/schema";
import ComplianceOverview from "./ComplianceOverview";

export default async function CompliancePage() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const [missionList, droneList, pilotList] = await withTenantContext(
    tenantId,
    async (tx) => {
      const m = await tx.select().from(missions).where(eq(missions.tenantId, tenantId));
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
      return [m, d, p] as const;
    },
  );

  return (
    <ComplianceOverview
      missions={missionList}
      drones={droneList}
      pilots={pilotList.map((p) => ({ ...p, userName: p.userName ?? undefined }))}
    />
  );
}
