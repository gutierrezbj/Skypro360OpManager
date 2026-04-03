/**
 * GET /api/airspace/notams
 * Proxy ENAIRE NOTAM_UAS_APP_V3 → normalized GeoJSON.
 * Uses node:https (not fetch) — ENAIRE ArcGIS rejects percent-encoded where clauses.
 * In-memory cache 24h (AIRAC cycle).
 */
import { NextResponse } from "next/server";
import https from "node:https";

// ENAIRE ArcGIS REST requires raw '=' in where — do NOT use URLSearchParams or fetch (encodes =)
const NOTAM_URL =
  "https://servais.enaire.es/insignias/rest/services/NOTAM/NOTAM_UAS_APP_V3/MapServer/1/query" +
  "?where=1=1&outFields=notamId,notamSerie,notamNumber,notamYear,itemA,itemE,LOWER_VAL,UPPER_VAL,FLYING_LEVELS_DESC,DESCRIPTION,fir" +
  "&f=geojson&resultOffset=0&resultRecordCount=1000";

const CACHE_TTL = 30 * 60 * 1000; // 30 min — NOTAMs son dinamicos, no ciclo AIRAC

type CacheEntry = { data: unknown; ts: number };
let _cache: CacheEntry | null = null;

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "OpsManager-Skypro360/1.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Invalid JSON from ENAIRE")); }
      });
    });
    req.setTimeout(15_000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", reject);
  });
}

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
      const notamCode = p.notamSerie
        ? `${p.notamSerie}${String(p.notamNumber ?? "").padStart(4, "0")}/${String(p.notamYear ?? "").slice(-2)}`
        : p.notamId ?? "";
      return {
        ...f,
        properties: {
          id: notamCode,
          name: p.itemA ? `FIR ${p.itemA}` : (p.fir ?? "NOTAM"),
          type: "NOTAM",
          restriction: "CONDITIONAL",
          altitudeFloor: p.LOWER_VAL ?? "SFC",
          altitudeCeiling: p.UPPER_VAL ?? "",
          description: stripHtml(p.DESCRIPTION) || stripHtml(p.FLYING_LEVELS_DESC) || stripHtml(p.itemE) || "",
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
    const raw = await httpsGet(NOTAM_URL);
    const data = normalize(raw);
    _cache = { data, ts: Date.now() };

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS", "X-NOTAM-Count": String(data.count) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[notams] ENAIRE fetch failed:", msg);

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
