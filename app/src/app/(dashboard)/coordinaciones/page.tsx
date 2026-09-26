import { requireAuth } from "@/server/middleware/auth";
import { withTenantContext } from "@/lib/db";
import { getMissionsForUser } from "@/lib/db/queries/missions.queries";
import { getCoordinationsForMissions } from "@/lib/db/queries/coordinations.queries";
import { canManageCoordinations } from "@/lib/auth/rbac";
import CoordinacionesClient from "./CoordinacionesClient";

export default async function CoordinacionesPage() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const role = session.user.role;

  const [missions, coordinations] = await withTenantContext(tenantId, async (tx) => {
    const m = await getMissionsForUser({ tenantId, userId, role }, tx);
    const c = await getCoordinationsForMissions(tenantId, m.map((x) => x.id), tx);
    return [m, c] as const;
  });

  return (
    <CoordinacionesClient
      missions={missions}
      coordinations={coordinations}
      canEdit={canManageCoordinations(role)}
    />
  );
}
