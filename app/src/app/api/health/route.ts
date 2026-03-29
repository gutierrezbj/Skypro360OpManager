import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "opsmanager",
    timestamp: new Date().toISOString(),
  });
}
