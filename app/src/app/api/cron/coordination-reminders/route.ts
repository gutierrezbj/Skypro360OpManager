import { NextResponse } from "next/server";
import { runCoordinationReminders } from "@/modules/coordinations/reminders";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const summary = await runCoordinationReminders();
  console.log("[cron] coordination-reminders", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const GET = POST;
