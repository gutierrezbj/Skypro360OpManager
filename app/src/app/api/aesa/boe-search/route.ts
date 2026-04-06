import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  searchBoeForOperator,
  searchBoeForPilot,
  searchBoeAesaUasNews,
} from "@/modules/integrations/services/boe.service";

/**
 * GET /api/aesa/boe-search
 *
 * Query params:
 *   type   = "operator" | "pilot" | "news"  (default: "news")
 *   name   = nombre a buscar (requerido para operator/pilot)
 *   rows   = numero de resultados (default: 5, max: 10)
 *
 * Ejemplos:
 *   /api/aesa/boe-search?type=operator&name=Skypro360
 *   /api/aesa/boe-search?type=pilot&name=Luis+Duran
 *   /api/aesa/boe-search?type=news&rows=5
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "news";
  const name = searchParams.get("name") ?? "";
  const rows = Math.min(parseInt(searchParams.get("rows") ?? "5"), 10);

  if ((type === "operator" || type === "pilot") && !name.trim()) {
    return NextResponse.json(
      { error: "Parametro 'name' requerido para type=operator|pilot" },
      { status: 400 },
    );
  }

  let result;
  switch (type) {
    case "operator":
      result = await searchBoeForOperator(name);
      break;
    case "pilot":
      result = await searchBoeForPilot(name);
      break;
    default:
      result = await searchBoeAesaUasNews(rows);
  }

  // Add cache headers — BOE data is stable (24h)
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Source": result.source,
    },
  });
}
