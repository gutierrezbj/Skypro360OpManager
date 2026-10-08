import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch {
    return NextResponse.json({ status: "degraded", db: false }, { status: 503 });
  }
  return NextResponse.json({
    status: "ok",
    db: true,
    app: "opsmanager",
    timestamp: new Date().toISOString(),
  });
}
