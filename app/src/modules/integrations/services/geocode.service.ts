/**
 * Geocoding service — Open-Meteo Geocoding API.
 *
 * API: https://geocoding-api.open-meteo.com/v1/search
 * - Sin auth, gratis, rate limit ~10k req/día/IP.
 * - Devuelve nombre + admin1 (CCAA/región) + admin2 (provincia) + lat/lng.
 * - No filtramos por país: el operador puede volar Portugal/Francia y
 *   distingue por admin1 en el dropdown.
 *
 * Cache 24h vía Next.js fetch (los nombres de ciudad no cambian).
 */

const OPEN_METEO_GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";

export type GeocodeResult = {
  name: string;
  admin1?: string;       // ej "Extremadura"
  admin2?: string;       // ej "Cáceres"
  country: string;       // ej "España"
  countryCode: string;   // ej "ES"
  lat: number;
  lng: number;
};

type OpenMeteoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  admin2?: string;
  population?: number;
};

type OpenMeteoResponse = {
  results?: OpenMeteoResult[];
};

/**
 * Busca ciudades por nombre. Devuelve hasta `count` resultados.
 * Si la API falla o devuelve vacío, devuelve array vacío (no lanza).
 */
export async function searchPlaces(
  query: string,
  opts: { count?: number; language?: string } = {},
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const count = Math.min(Math.max(opts.count ?? 6, 1), 10);
  const language = opts.language ?? "es";

  const url =
    `${OPEN_METEO_GEOCODE}?name=${encodeURIComponent(trimmed)}` +
    `&count=${count}&language=${language}&format=json`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 }, // 24h server-cache
    });
    if (!res.ok) return [];

    const data = (await res.json()) as OpenMeteoResponse;
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r) => ({
      name: r.name,
      admin1: r.admin1,
      admin2: r.admin2,
      country: r.country,
      countryCode: r.country_code,
      lat: r.latitude,
      lng: r.longitude,
    }));
  } catch {
    return [];
  }
}
