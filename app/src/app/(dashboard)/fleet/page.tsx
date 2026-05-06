import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { drones, pilots, users } from "@/lib/db/schema";
import { canManageFleet } from "@/lib/auth/rbac";
import FleetTabs from "@/modules/fleet/components/FleetTabs";

export default async function FleetPage() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const role = (session.user as { role: string }).role;

  const [droneList, pilotList, userList] = await withTenantContext(tenantId, async (tx) => {
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
        userEmail: users.email,
      })
      .from(pilots)
      .leftJoin(users, eq(pilots.userId, users.id))
      .where(eq(pilots.tenantId, tenantId));

    const u = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    return [d, p, u] as const;
  });

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold" style={{ color: "var(--sky-text)" }}>Flota</h1>
      <FleetTabs
        drones={droneList}
        pilots={pilotList.map((p) => ({
          ...p,
          userName: p.userName ?? undefined,
          userEmail: p.userEmail ?? undefined,
        }))}
        users={userList}
        canEdit={canManageFleet(role)}
      />
    </div>
    </div>
  );
}
