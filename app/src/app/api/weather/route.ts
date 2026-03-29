import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeatherForLocation } from "@/modules/integrations/services/aemet.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const date = searchParams.get("date") ?? undefined;

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Missing lat/lng parameters" },
      { status: 400 },
    );
  }

  const forecast = await getWeatherForLocation(lat, lng, date);
  return NextResponse.json(forecast);
}
