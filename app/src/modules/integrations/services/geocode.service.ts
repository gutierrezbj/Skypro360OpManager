/**
 * Geocoding service — Nominatim (OpenStreetMap).
 *
 * API: https://nominatim.openstreetmap.org/search
 * - Sin auth, gratis, sin coste.
 * - Cobertura global: direcciones (calle + número), ciudades, barrios, POIs.
 * - Política: User-Agent obligatorio identificando la app + email de contacto.
 *   Recomienda max 1 req/seg sin cache. Nuestro server-side cache 24h (Next
 *   revalidate) y el debounce 300ms en cliente lo dejan muy por debajo.
 *
 * Por qué no Open-Meteo Geocoding:
 *   solo cubre ciudades/poblaciones, no direcciones específicas. El usuario
 *   metía "Calle Mayor 12, Madrid" y no salía nada.
 *
 * Por qué no Mapbox/Google:
 *   son de pago a partir de cierto volumen y requieren API key. Mantener todo
 *   gratis y sin keys de terceros es una decisión consciente (alineada con
 *   AEMET, Open-Meteo Forecast, NOAA SWPC).
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
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
 * Devuelve hasta `count` resultados. Array vacío si la API falla.
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
    `${NOMINATIM_URL}?q=${encodeURIComponent(trimmed)}` +
    `&format=json&limit=${count}&accept-language=${language}` +
    `&addressdetails=1`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 }, // 24h server-cache
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
