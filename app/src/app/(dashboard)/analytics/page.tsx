import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { withTenantContext } from "@/lib/db";
import { getAnalyticsData } from "@/lib/db/queries/analytics.queries";
import { canSeeAnalytics } from "@/lib/auth/rbac";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantId = (session.user as { tenantId?: string }).tenantId;
  const role = (session.user as { role?: string }).role ?? "viewer";
  if (!tenantId) redirect("/login");

  // RBAC: solo admin / org_admin / coordinator
  if (!canSeeAnalytics(role)) redirect("/");

  const data = await withTenantContext(tenantId, () => getAnalyticsData(tenantId));

  return <AnalyticsDashboard data={data} />;
}
