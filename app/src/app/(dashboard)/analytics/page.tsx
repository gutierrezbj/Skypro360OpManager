import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { withTenantContext } from "@/lib/db/tenant";
import { getAnalyticsData } from "@/lib/db/queries/analytics.queries";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantId = (session.user as { tenantId?: string }).tenantId;
  if (!tenantId) redirect("/login");

  const data = await withTenantContext(tenantId, () => getAnalyticsData(tenantId));

  return <AnalyticsDashboard data={data} />;
}
