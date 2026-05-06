/**
 * Geocoding service — chain Nominatim → Photon (ambos OSM, gratis).
 *
 * Nominatim:    cobertura completa, formal, requiere User-Agent y máx 1req/seg.
 *               https://nominatim.openstreetmap.org/search
 * Photon (Komoot): optimizado para autocomplete y parciales, mejor con
 *                  cadenas mal escritas o incompletas. Sin User-Agent obligatorio.
 *                  https://photon.komoot.io/api/
 *
 * Estrategia: Nominatim primero (más preciso). Si devuelve <2 resultados o
 * falla, intenta Photon como fallback. Mergea ambos resultados con dedupe
 * por (lat,lng) redondeado a 4 decimales (precisión de calle).
 *
 * Cache server-side 24h por término (Next revalidate). Con esto y debounce
 * 300ms en cliente estamos muy por debajo de los rate limits de cualquiera.
 *
 * Por qué no Mapbox/Google: son de pago y requieren API key. Mantener todo
 * gratis y sin keys de terceros es una decisión consciente.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const PHOTON_URL = "https://photon.komoot.io/api/";
const USER_AGENT = "OpsManager-Skypro360/1.0 (gutierrezbj@gmail.com)";

export type GeocodeResult = {
  name: string;          // primer fragmento legible (ej "Calle Mayor 12" o "Madrid")
  admin1?: string;       // ej "Comunidad de Madrid"
  admin2?: string;       // ej "Madrid" (provincia/municipio)
  country: string;       // ej "España"
  countryCode: string;   // ej "ES"
  lat: number;
  lng: number;
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: NominatimAddress;
};

/**
 * Construye un nombre legible a partir de la dirección Nominatim.
 * Para direcciones: "Calle Mayor 12" / "Calle Mayor"
 * Para ciudades: "Madrid"
 * Para POIs sin road: usa el primer fragmento del display_name.
 */
function buildName(r: NominatimResult): string {
  const a = r.address ?? {};
  // Dirección con calle
  if (a.road) {
    return a.house_number ? `${a.road} ${a.house_number}` : a.road;
  }
  // Núcleo poblacional / municipio
  const place = a.city ?? a.town ?? a.village ?? a.municipality;
  if (place) return place;
  // Fallback: primer trozo del display_name
  return r.display_name.split(",")[0].trim();
}

/** Distingue municipio/provincia/CCAA en admin2 */
function buildAdmin2(r: NominatimResult): string | undefined {
  const a = r.address ?? {};
  // Si el name ya es la calle, queremos ciudad como admin2
  if (a.road) {
    return a.city ?? a.town ?? a.village ?? a.municipality ?? a.county;
  }
  // Si name es la ciudad, admin2 es la provincia
  return a.county ?? a.municipality;
}

/**
 * Busca direcciones, ciudades o POIs por texto libre.
 * Pipeline: Nominatim → si <2 resultados, fallback a Photon.
 * Mergea ambos con dedupe por coordenada redondeada (4 decimales).
 */
export async function searchPlaces(
  query: string,
  opts: { count?: number; language?: string } = {},
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const count = Math.min(Math.max(opts.count ?? 8, 1), 10);
  const language = opts.language ?? "es";

  const nomResults = await searchNominatim(trimmed, count, language);

  // Si Nominatim trae suficientes, devolvemos directo.
  if (nomResults.length >= 2) return nomResults.slice(0, count);

  // Fallback: Photon (mejor para parciales/typos)
  const photonResults = await searchPhoton(trimmed, count, language);

  // Mergea: Nominatim primero (más preciso), luego Photon (sin duplicar).
  const merged = [...nomResults];
  const seen = new Set(nomResults.map((r) => coordKey(r.lat, r.lng)));
  for (const p of photonResults) {
    const k = coordKey(p.lat, p.lng);
    if (!seen.has(k)) {
      merged.push(p);
      seen.add(k);
    }
  }
  return merged.slice(0, count);
}

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

// ── Nominatim ────────────────────────────────────────────────────────────────

async function searchNominatim(
  query: string,
  count: number,
  language: string,
): Promise<GeocodeResult[]> {
  // countrycodes=es,pt: priorizar península ibérica (incluye Portugal por
  // si Luis vuela cerca de la frontera). Sin restringir absoluto: si no
  // encuentra, igualmente se cae a Photon que es mundial.
  const url =
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}` +
    `&format=json&limit=${count}&accept-language=${language}` +
    `&addressdetails=1&dedupe=1&countrycodes=es,pt`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as NominatimResult[];
    if (!Array.isArray(data)) return [];

    return data
      .map<GeocodeResult>((r) => {
        const a = r.address ?? {};
        return {
          name: buildName(r),
          admin1: a.state,
          admin2: buildAdmin2(r),
          country: a.country ?? "—",
          countryCode: (a.country_code ?? "").toUpperCase(),
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        };
      })
      .filter((r) => !isNaN(r.lat) && !isNaN(r.lng));
  } catch {
    return [];
  }
}

// ── Photon (Komoot) ──────────────────────────────────────────────────────────

type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  osm_value?: string;
  type?: string;
};

type PhotonFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lon, lat]
  properties: PhotonProperties;
};

type PhotonResponse = {
  type: "FeatureCollection";
  features?: PhotonFeature[];
};

async function searchPhoton(
  query: string,
  count: number,
  language: string,
): Promise<GeocodeResult[]> {
  const url =
    `${PHOTON_URL}?q=${encodeURIComponent(query)}` +
    `&limit=${count}&lang=${language}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as PhotonResponse;
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features
      .map<GeocodeResult>((f) => {
        const p = f.properties;
        const [lon, lat] = f.geometry.coordinates;
        // Construir name siguiendo la misma lógica que Nominatim
        let name: string;
        if (p.street) {
          name = p.housenumber ? `${p.street} ${p.housenumber}` : p.street;
        } else {
          name = p.name ?? p.city ?? p.district ?? "—";
        }
        return {
          name,
          admin1: p.state,
          admin2: p.street ? p.city : p.county,
          country: p.country ?? "—",
          countryCode: (p.countrycode ?? "").toUpperCase(),
          lat,
          lng: lon,
        };
      })
      .filter((r) => !isNaN(r.lat) && !isNaN(r.lng));
  } catch {
    return [];
  }
}
