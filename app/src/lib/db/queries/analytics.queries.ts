import { sql, eq, and, gte, count, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { missions, drones, pilots, flightLogs } from "@/lib/db/schema";

/**
 * Analytics queries — aggregations for the analytics dashboard.
 * All queries are tenant-scoped.
 */

export type StatusCount = { status: string; total: number };
export type PriorityCount = { priority: string; total: number };
export type MonthlyCount = { month: string; label: string; total: number };
export type DroneStatusCount = { status: string; total: number };

export type AnalyticsData = {
  // KPIs
  totalMissions: number;
  completedMissions: number;
  abortedMissions: number;
  cancelledMissions: number;
  inFlightNow: number;
  completionRate: number; // 0-100
  totalFlightHoursFromPilots: number;
  totalFlightMinutesFromLogs: number;
  totalDrones: number;
  activeDrones: number;
  totalPilots: number;
  validPilots: number;

  // Charts
  byStatus: StatusCount[];
  byPriority: PriorityCount[];
  byDroneStatus: DroneStatusCount[];
  monthly: MonthlyCount[];
};

const MONTH_LABELS: Record<number, string> = {
  0: "Ene", 1: "Feb", 2: "Mar", 3: "Abr", 4: "May", 5: "Jun",
  6: "Jul", 7: "Ago", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dic",
};

export async function getAnalyticsData(tenantId: string): Promise<AnalyticsData> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    statusRows,
    priorityRows,
    droneStatusRows,
    monthlyRows,
    pilotRows,
    flightLogRows,
    droneCountRows,
  ] = await Promise.all([
    // Missions by status
    db
      .select({ status: missions.status, total: count() })
      .from(missions)
      .where(eq(missions.tenantId, tenantId))
      .groupBy(missions.status),

    // Missions by priority
    db
      .select({ priority: missions.priority, total: count() })
      .from(missions)
      .where(eq(missions.tenantId, tenantId))
      .groupBy(missions.priority),

    // Drones by status
    db
      .select({ status: drones.status, total: count() })
      .from(drones)
      .where(eq(drones.tenantId, tenantId))
      .groupBy(drones.status),

    // Missions created per month — last 6 months
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${missions.createdAt}), 'YYYY-MM')`,
        total: count(),
      })
      .from(missions)
      .where(
        and(
          eq(missions.tenantId, tenantId),
          gte(missions.createdAt, sixMonthsAgo),
        ),
      )
      .groupBy(sql`date_trunc('month', ${missions.createdAt})`)
      .orderBy(sql`date_trunc('month', ${missions.createdAt})`),

    // Pilots summary
    db
      .select({
        total: count(),
        validCount: sql<number>`count(*) filter (where ${pilots.certificationStatus} = 'valid')`,
        totalHours: sum(pilots.flightHours),
      })
      .from(pilots)
      .where(eq(pilots.tenantId, tenantId)),

    // Flight logs total minutes
    db
      .select({ totalMinutes: sum(flightLogs.durationMinutes) })
      .from(flightLogs)
      .where(eq(flightLogs.tenantId, tenantId)),

    // Drone counts
    db
      .select({
        total: count(),
        activeCount: sql<number>`count(*) filter (where ${drones.status} = 'active')`,
      })
      .from(drones)
      .where(eq(drones.tenantId, tenantId)),
  ]);

  // Build monthly series — fill gaps with 0
  const monthlyMap = new Map(monthlyRows.map((r) => [r.month, r.total]));
  const monthly: MonthlyCount[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({
      month: key,
      label: MONTH_LABELS[d.getMonth()] ?? key,
      total: monthlyMap.get(key) ?? 0,
    });
  }

  // Aggregate status counts
  const statusMap = Object.fromEntries(statusRows.map((r) => [r.status, r.total]));
  const completed = statusMap["completed"] ?? 0;
  const aborted = statusMap["aborted"] ?? 0;
  const cancelled = statusMap["cancelled"] ?? 0;
  const inFlight = statusMap["in_flight"] ?? 0;
  const totalMissions = statusRows.reduce((s, r) => s + r.total, 0);
  const totalClosed = completed + aborted + cancelled;
  const completionRate = totalClosed > 0 ? Math.round((completed / totalClosed) * 100) : 0;

  const pilotRow = pilotRows[0];
  const flightLogRow = flightLogRows[0];
  const droneCountRow = droneCountRows[0];

  return {
    totalMissions,
    completedMissions: completed,
    abortedMissions: aborted,
    cancelledMissions: cancelled,
    inFlightNow: inFlight,
    completionRate,
    totalFlightHoursFromPilots: parseFloat(String(pilotRow?.totalHours ?? 0)),
    totalFlightMinutesFromLogs: parseInt(String(flightLogRow?.totalMinutes ?? 0)),
    totalDrones: droneCountRow?.total ?? 0,
    activeDrones: Number(droneCountRow?.activeCount ?? 0),
    totalPilots: pilotRow?.total ?? 0,
    validPilots: Number(pilotRow?.validCount ?? 0),
    byStatus: statusRows.map((r) => ({ status: r.status, total: r.total })),
    byPriority: priorityRows.map((r) => ({ priority: r.priority, total: r.total })),
    byDroneStatus: droneStatusRows.map((r) => ({ status: r.status, total: r.total })),
    monthly,
  };
}
