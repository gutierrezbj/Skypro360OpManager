import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchPlaces } from "@/modules/integrations/services/geocode.service";

/**
 * GET /api/geocode?q=<text>
 *
 * Proxy a Open-Meteo Geocoding API. Solo accesible con sesión.
 * Devuelve hasta 6 resultados con { name, admin1, admin2, country, lat, lng }.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchPlaces(q);
  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
