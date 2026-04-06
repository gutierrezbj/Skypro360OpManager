/**
 * BOE (Boletin Oficial del Estado) API integration.
 *
 * AESA publica resoluciones de operadores habilitados, certificados STS
 * y autorizaciones de categoria especifica en el BOE.
 *
 * API publica: https://api.boe.es
 * Endpoint busqueda: GET /api/boe/buscar?q={query}&d={fecha}&rows={n}
 * Respuesta: XML (parseamos sin dependencias externas)
 * Rate limit: sin limite documentado, usamos cache 24h.
 *
 * Tipos de publicaciones AESA relevantes:
 * - Resoluciones AESA operadores categoria especifica
 * - Certificados STS-01 / STS-02
 * - Reconocimiento habilitaciones pilotos RPAS
 * - Sanciones / suspensiones publicadas
 */

const BOE_API_BASE = "https://api.boe.es";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoeDocument = {
  id: string;
  title: string;
  date: string;           // YYYY-MM-DD
  section: string;        // "AESA" | "MINISTERIO DE TRANSPORTES" | etc.
  url: string;            // URL PDF del BOE
  relevance: "high" | "medium" | "low";
  matchReason: string;
};

export type BoeSearchResult = {
  query: string;
  total: number;
  documents: BoeDocument[];
  searchedAt: string;
  source: "boe_api" | "cache" | "error_fallback";
  error?: string;
};

// ─── In-memory cache ──────────────────────────────────────────────────────────

const cache = new Map<string, { result: BoeSearchResult; expiresAt: number }>();

function getCached(key: string): BoeSearchResult | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.result;
  cache.delete(key);
  return null;
}

function setCached(key: string, result: BoeSearchResult): void {
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── XML parsing ──────────────────────────────────────────────────────────────

function extractXmlValue(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  return match ? match[1].replace(/<!\\[CDATA\\[|\\]\\]>/g, "").trim() : "";
}

function extractAllXmlBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
  return xml.match(re) ?? [];
}

function parseBoeXml(xml: string, query: string): BoeDocument[] {
  const items = extractAllXmlBlocks(xml, "item");
  const docs: BoeDocument[] = [];

  for (const item of items) {
    const id    = extractXmlValue(item, "identificador");
    const title = extractXmlValue(item, "titulo");
    const date  = extractXmlValue(item, "fecha_publicacion");          // DD/MM/YYYY
    const dept  = extractXmlValue(item, "departamento");
    const url   = extractXmlValue(item, "url_pdf") ||
                  extractXmlValue(item, "url_html") || "";

    if (!id || !title) continue;

    // Parse date DD/MM/YYYY → YYYY-MM-DD
    const dateParts = date.split("/");
    const isoDate = dateParts.length === 3
      ? `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`
      : date;

    // Determine relevance based on keywords
    const titleLower = title.toLowerCase();
    let relevance: BoeDocument["relevance"] = "low";
    let matchReason = "";

    if (
      titleLower.includes("aesa") ||
      titleLower.includes("aeronave no tripulada") ||
      titleLower.includes("uas") || titleLower.includes("rpas") ||
      titleLower.includes("drone") || titleLower.includes("dron")
    ) {
      relevance = "high";
      matchReason = "Mencion directa de UAS/RPAS/AESA";
    } else if (
      titleLower.includes("piloto") ||
      titleLower.includes("operador") ||
      titleLower.includes("habilitacion") ||
      titleLower.includes("categoria especifica") ||
      titleLower.includes("sts-0")
    ) {
      relevance = "medium";
      matchReason = "Habilitacion de operador o piloto";
    } else if (
      titleLower.includes("seguridad aérea") ||
      titleLower.includes("navegacion aerea") ||
      dept.toLowerCase().includes("aesa")
    ) {
      relevance = "medium";
      matchReason = "Publicacion de seguridad aerea";
    } else {
      matchReason = "Coincidencia textual con query";
    }

    // Build full BOE URL if relative
    const fullUrl = url.startsWith("http")
      ? url
      : url ? `https://www.boe.es${url}` : `https://www.boe.es/buscar/doc.php?id=${id}`;

    docs.push({
      id,
      title,
      date: isoDate,
      section: dept || "BOE",
      url: fullUrl,
      relevance,
      matchReason,
    });
  }

  // Sort by relevance then date (most recent first)
  const order = { high: 0, medium: 1, low: 2 };
  return docs
    .sort((a, b) => order[a.relevance] - order[b.relevance] || b.date.localeCompare(a.date))
    .slice(0, 10);
}

// ─── Search functions ─────────────────────────────────────────────────────────

/**
 * Busca en el BOE publicaciones relacionadas con un operador UAS.
 * Util para confirmar resoluciones AESA de categoria especifica.
 */
export async function searchBoeForOperator(
  operatorName: string,
): Promise<BoeSearchResult> {
  const query = `${operatorName} operador UAS AESA`;
  return _search(query);
}

/**
 * Busca en el BOE publicaciones sobre un piloto o habilitacion especifica.
 */
export async function searchBoeForPilot(
  pilotName: string,
): Promise<BoeSearchResult> {
  const query = `${pilotName} piloto RPAS UAS AESA habilitacion`;
  return _search(query);
}

/**
 * Busca publicaciones BOE generales sobre drones/UAS de AESA.
 * Util para mostrar normativa reciente relevante.
 */
export async function searchBoeAesaUasNews(rows = 5): Promise<BoeSearchResult> {
  const query = "AESA aeronave no tripulada UAS RPAS categoria especifica";
  return _search(query, rows);
}

// ─── Internal fetch ───────────────────────────────────────────────────────────

async function _search(query: string, rows = 5): Promise<BoeSearchResult> {
  const cacheKey = `${query}:${rows}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  const params = new URLSearchParams({
    q: query,
    rows: rows.toString(),
    campo: "titulo",        // buscar en titulo (mas preciso que full-text)
  });

  const url = `${BOE_API_BASE}/api/boe/buscar?${params}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`BOE API HTTP ${response.status}`);
    }

    const xml = await response.text();
    const documents = parseBoeXml(xml, query);

    // Extract total from XML
    const totalMatch = /<total>(\d+)<\/total>/i.exec(xml);
    const total = totalMatch ? parseInt(totalMatch[1]) : documents.length;

    const result: BoeSearchResult = {
      query,
      total,
      documents,
      searchedAt: new Date().toISOString(),
      source: "boe_api",
    };

    setCached(cacheKey, result);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Error desconocido";
    return {
      query,
      total: 0,
      documents: [],
      searchedAt: new Date().toISOString(),
      source: "error_fallback",
      error: `BOE API no disponible: ${error}. Verificacion manual en https://www.boe.es`,
    };
  }
}
