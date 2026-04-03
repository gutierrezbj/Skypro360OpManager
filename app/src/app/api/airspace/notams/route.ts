/**
 * GET /api/airspace/notams
 * Proxy ENAIRE NOTAM_UAS_APP_V3 → normalized GeoJSON.
 * In-memory cache 24h (AIRAC cycle).
 */
import { NextResponse } from "next/server";

const NOTAM_URL =
  "https://servais.enaire.es/insignias/rest/services/NOTAM/NOTAM_UAS_APP_V3/MapServer/1/query" +
  "?where=1%3D1&outFields=IDENT_TXT,NAME_TXT,TYPE_CODE,NIVEL_INF,NIVEL_SUP,REMARKS_TXT,REMARKS_TXT_en" +
  "&f=geojson&resultOffset=0&resultRecordCount=1000";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

type CacheEntry = { data: unknown; ts: number };
let _cache: CacheEntry | null = null;

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any) {
  const features = (raw?.features ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((f: any) => f.geometry)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((f: any) => {
      const p = f.properties ?? {};
      return {
        ...f,
        properties: {
          id: p.IDENT_TXT ?? "",
          name: p.NAME_TXT ?? p.IDENT_TXT ?? "NOTAM sin nombre",
          type: "NOTAM",
          restriction: "CONDITIONAL",
          altitudeFloor: p.NIVEL_INF ?? "SFC",
          altitudeCeiling: p.NIVEL_SUP ?? "",
          description:
            stripHtml(p.REMARKS_TXT) || stripHtml(p.REMARKS_TXT_en) || "",
          source: "ENAIRE NOTAM_UAS_APP_V3",
        },
      };
    });

  return {
    type: "FeatureCollection",
    fetchedAt: new Date().toISOString(),
    count: features.length,
    features,
  };
}

export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json(_cache.data, {
      headers: { "X-Cache": "HIT", "X-Cache-Age": String(Math.round((Date.now() - _cache.ts) / 1000)) },
    });
  }

  try {
    const res = await fetch(NOTAM_URL, {
      headers: { "User-Agent": "OpsManager-Skypro360/1.0" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`ENAIRE HTTP ${res.status}`);
    }

    const raw = await res.json();
    const data = normalize(raw);
    _cache = { data, ts: Date.now() };

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS", "X-NOTAM-Count": String(data.count) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[notams] ENAIRE fetch failed:", msg);

    // Return stale cache if available rather than hard fail
    if (_cache) {
      return NextResponse.json(_cache.data, {
        headers: { "X-Cache": "STALE", "X-Cache-Error": msg },
      });
    }

    return NextResponse.json(
      { error: "ENAIRE temporalmente no disponible", detail: msg },
      { status: 503 }
    );
  }
}
