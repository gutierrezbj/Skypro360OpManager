/**
 * AEMET OpenData API service.
 *
 * Fetches weather forecasts from Spain's national weather agency.
 * API docs: https://opendata.aemet.es/dist/index.html
 *
 * Requires AEMET_API_KEY env var (free registration).
 * Falls back to a basic estimate when no key is configured.
 */

const AEMET_BASE = "https://opendata.aemet.es/opendata/api";

export type WeatherForecast = {
  source: "aemet" | "fallback";
  municipio?: string;
  fecha: string;
  temperatura: { min: number; max: number };
  viento: { velocidad: number; direccion: string };
  precipitacion: number;
  estadoCielo: string;
  estadoCieloDesc: string;
  aptoVuelo: boolean;
  razon?: string;
  // ── Datos extendidos (Open-Meteo supplement + NOAA) ─────────────────────
  humedad?: number | null;        // % HR
  rafagas?: number | null;        // km/h gust max
  visibilidad?: number | null;    // km
  nubosidad?: number | null;      // % cobertura nubosa numérica
  uvIndex?: number | null;        // 0-11+ índice UV solar
  amanecer?: string | null;       // HH:MM hora local
  ocaso?: string | null;          // HH:MM hora local
  kpIndex?: number | null;        // 0-9 actividad geomagnética (GPS)
  kpStatus?: "optimo" | "degradado" | "inestable" | null;
};

/**
 * AEMET municipality codes (~150) cubriendo capitales de provincia +
 * principales municipios costeros y turísticos de España.
 *
 * Códigos siguen formato INE (5 dígitos). Coordenadas centroide municipio.
 * Si una coordenada cae a >80 km del más cercano, no usamos AEMET — solo
 * Open-Meteo (que es global y siempre tiene cobertura).
 *
 * Para añadir municipios: https://www.ine.es/jaxiT3/Tabla.htm?t=2879
 */
const MUNICIPIOS_AEMET: Array<{ code: string; name: string; lat: number; lng: number }> = [
  // ── Capitales de provincia ────────────────────────────────────────────
  { code: "28079", name: "Madrid",                lat: 40.4168, lng: -3.7038 },
  { code: "08019", name: "Barcelona",             lat: 41.3851, lng:  2.1734 },
  { code: "46250", name: "Valencia",              lat: 39.4699, lng: -0.3763 },
  { code: "41091", name: "Sevilla",               lat: 37.3886, lng: -5.9823 },
  { code: "50297", name: "Zaragoza",              lat: 41.6488, lng: -0.8891 },
  { code: "29067", name: "Málaga",                lat: 36.7213, lng: -4.4214 },
  { code: "48020", name: "Bilbao",                lat: 43.2630, lng: -2.9350 },
  { code: "03014", name: "Alicante/Alacant",      lat: 38.3452, lng: -0.4810 },
  { code: "47186", name: "Valladolid",            lat: 41.6523, lng: -4.7245 },
  { code: "14021", name: "Córdoba",               lat: 37.8882, lng: -4.7794 },
  { code: "07040", name: "Palma",                 lat: 39.5696, lng:  2.6502 },
  { code: "35016", name: "Las Palmas de Gran Canaria", lat: 28.1235, lng: -15.4366 },
  { code: "38038", name: "Santa Cruz de Tenerife",lat: 28.4636, lng: -16.2518 },
  { code: "30030", name: "Murcia",                lat: 37.9922, lng: -1.1307 },
  { code: "18087", name: "Granada",               lat: 37.1773, lng: -3.5986 },
  { code: "20069", name: "Donostia/San Sebastián",lat: 43.3183, lng: -1.9812 },
  { code: "15030", name: "A Coruña",              lat: 43.3623, lng: -8.4115 },
  { code: "39075", name: "Santander",             lat: 43.4623, lng: -3.8100 },
  { code: "31201", name: "Pamplona/Iruña",        lat: 42.8169, lng: -1.6432 },
  { code: "45168", name: "Toledo",                lat: 39.8628, lng: -4.0273 },
  { code: "10037", name: "Cáceres",               lat: 39.4753, lng: -6.3724 },
  { code: "06015", name: "Badajoz",               lat: 38.8794, lng: -6.9707 },
  { code: "09059", name: "Burgos",                lat: 42.3439, lng: -3.6969 },
  { code: "24089", name: "León",                  lat: 42.5987, lng: -5.5671 },
  { code: "37274", name: "Salamanca",             lat: 40.9701, lng: -5.6635 },
  { code: "49275", name: "Zamora",                lat: 41.5036, lng: -5.7400 },
  { code: "05019", name: "Ávila",                 lat: 40.6566, lng: -4.6810 },
  { code: "40194", name: "Segovia",               lat: 40.9429, lng: -4.1088 },
  { code: "34120", name: "Palencia",              lat: 42.0096, lng: -4.5288 },
  { code: "42173", name: "Soria",                 lat: 41.7665, lng: -2.4790 },
  { code: "19130", name: "Guadalajara",           lat: 40.6298, lng: -3.1672 },
  { code: "02003", name: "Albacete",              lat: 38.9943, lng: -1.8585 },
  { code: "13034", name: "Ciudad Real",           lat: 38.9848, lng: -3.9272 },
  { code: "16078", name: "Cuenca",                lat: 40.0719, lng: -2.1372 },
  { code: "21041", name: "Huelva",                lat: 37.2614, lng: -6.9447 },
  { code: "23050", name: "Jaén",                  lat: 37.7796, lng: -3.7849 },
  { code: "04013", name: "Almería",               lat: 36.8340, lng: -2.4637 },
  { code: "11012", name: "Cádiz",                 lat: 36.5298, lng: -6.2924 },
  { code: "12040", name: "Castellón de la Plana", lat: 39.9864, lng: -0.0513 },
  { code: "22125", name: "Huesca",                lat: 42.1362, lng: -0.4087 },
  { code: "25120", name: "Lleida",                lat: 41.6176, lng:  0.6200 },
  { code: "26089", name: "Logroño",               lat: 42.4627, lng: -2.4449 },
  { code: "27028", name: "Lugo",                  lat: 43.0125, lng: -7.5550 },
  { code: "32054", name: "Ourense",               lat: 42.3358, lng: -7.8639 },
  { code: "33044", name: "Oviedo",                lat: 43.3614, lng: -5.8493 },
  { code: "36038", name: "Pontevedra",            lat: 42.4296, lng: -8.6446 },
  { code: "43148", name: "Tarragona",             lat: 41.1189, lng:  1.2445 },
  { code: "44216", name: "Teruel",                lat: 40.3434, lng: -1.1065 },
  { code: "51001", name: "Ceuta",                 lat: 35.8894, lng: -5.3198 },
  { code: "52001", name: "Melilla",               lat: 35.2923, lng: -2.9381 },
  // ── Costa del Sol (Málaga) ────────────────────────────────────────────
  { code: "29069", name: "Marbella",              lat: 36.5099, lng: -4.8862 },
  { code: "29051", name: "Fuengirola",            lat: 36.5400, lng: -4.6244 },
  { code: "29070", name: "Mijas",                 lat: 36.5957, lng: -4.6373 },
  { code: "29074", name: "Nerja",                 lat: 36.7522, lng: -3.8744 },
  { code: "29089", name: "Torremolinos",          lat: 36.6203, lng: -4.4995 },
  { code: "29094", name: "Vélez-Málaga",          lat: 36.7846, lng: -4.0991 },
  { code: "29040", name: "Estepona",              lat: 36.4264, lng: -5.1456 },
  { code: "29063", name: "Manilva",               lat: 36.3760, lng: -5.2491 },
  { code: "29006", name: "Antequera",             lat: 37.0192, lng: -4.5610 },
  { code: "29007", name: "Archidona",             lat: 37.0937, lng: -4.3879 },
  { code: "29084", name: "Ronda",                 lat: 36.7411, lng: -5.1659 },
  // ── Costa Brava / Cataluña ───────────────────────────────────────────
  { code: "17066", name: "Lloret de Mar",         lat: 41.6993, lng:  2.8458 },
  { code: "17131", name: "Tossa de Mar",          lat: 41.7193, lng:  2.9320 },
  { code: "17147", name: "Roses",                 lat: 42.2625, lng:  3.1759 },
  { code: "17023", name: "Cadaqués",              lat: 42.2892, lng:  3.2783 },
  { code: "17118", name: "Palafrugell",           lat: 41.9165, lng:  3.1632 },
  { code: "08035", name: "Calella",               lat: 41.6147, lng:  2.6651 },
  { code: "17160", name: "Sant Feliu de Guíxols", lat: 41.7818, lng:  3.0294 },
  { code: "08015", name: "Badalona",              lat: 41.4500, lng:  2.2474 },
  { code: "08245", name: "Sitges",                lat: 41.2371, lng:  1.8112 },
  { code: "17114", name: "Olot",                  lat: 42.1818, lng:  2.4900 },
  { code: "17079", name: "Girona",                lat: 41.9794, lng:  2.8214 },
  // ── Costa Blanca / Cálida ────────────────────────────────────────────
  { code: "03019", name: "Benidorm",              lat: 38.5347, lng: -0.1310 },
  { code: "03027", name: "Calp/Calpe",            lat: 38.6448, lng:  0.0487 },
  { code: "03065", name: "Dénia",                 lat: 38.8407, lng:  0.1063 },
  { code: "03133", name: "Torrevieja",            lat: 37.9785, lng: -0.6822 },
  { code: "03082", name: "Jávea/Xàbia",           lat: 38.7896, lng:  0.1659 },
  { code: "30016", name: "Cartagena",             lat: 37.6052, lng: -0.9863 },
  { code: "30003", name: "Águilas",               lat: 37.4061, lng: -1.5828 },
  // ── Baleares ──────────────────────────────────────────────────────────
  { code: "07014", name: "Calvià",                lat: 39.5645, lng:  2.5052 },
  { code: "07033", name: "Manacor",               lat: 39.5703, lng:  3.2089 },
  { code: "07026", name: "Inca",                  lat: 39.7220, lng:  2.9118 },
  { code: "07054", name: "Pollença",              lat: 39.8775, lng:  3.0149 },
  { code: "07032", name: "Eivissa/Ibiza",         lat: 38.9067, lng:  1.4206 },
  { code: "07064", name: "Sant Antoni de Portmany", lat: 38.9803, lng: 1.3013 },
  { code: "07050", name: "Maó-Mahón",             lat: 39.8881, lng:  4.2659 },
  // ── Canarias ──────────────────────────────────────────────────────────
  { code: "35023", name: "San Bartolomé de Tirajana (Maspalomas)", lat: 27.7600, lng: -15.5859 },
  { code: "35028", name: "Telde",                 lat: 28.0010, lng: -15.4163 },
  { code: "35012", name: "Gáldar",                lat: 28.1454, lng: -15.6541 },
  { code: "38001", name: "Adeje",                 lat: 28.1226, lng: -16.7261 },
  { code: "38023", name: "La Laguna",             lat: 28.4853, lng: -16.3204 },
  { code: "38028", name: "Los Realejos",          lat: 28.3818, lng: -16.5780 },
  { code: "38040", name: "Puerto de la Cruz",     lat: 28.4137, lng: -16.5481 },
  { code: "38003", name: "Arona",                 lat: 28.0997, lng: -16.6810 },
  { code: "38051", name: "Santiago del Teide",    lat: 28.2956, lng: -16.8267 },
  { code: "38029", name: "Los Llanos de Aridane (La Palma)", lat: 28.6586, lng: -17.9180 },
  // ── Galicia ───────────────────────────────────────────────────────────
  { code: "36057", name: "Vigo",                  lat: 42.2406, lng: -8.7207 },
  { code: "15078", name: "Santiago de Compostela",lat: 42.8782, lng: -8.5448 },
  { code: "36042", name: "O Grove",               lat: 42.4977, lng: -8.8650 },
  { code: "36063", name: "Vilagarcía de Arousa",  lat: 42.5972, lng: -8.7659 },
  // ── Extremadura ───────────────────────────────────────────────────────
  { code: "06083", name: "Mérida",                lat: 38.9160, lng: -6.3438 },
  { code: "10148", name: "Plasencia",             lat: 40.0302, lng: -6.0887 },
  { code: "10195", name: "Trujillo",              lat: 39.4588, lng: -5.8819 },
  { code: "06011", name: "Almendralejo",          lat: 38.6830, lng: -6.4074 },
  { code: "06044", name: "Don Benito",            lat: 38.9550, lng: -5.8601 },
  { code: "06158", name: "Zafra",                 lat: 38.4168, lng: -6.4182 },
  { code: "10131", name: "Navalmoral de la Mata", lat: 39.8917, lng: -5.5407 },
  { code: "10067", name: "Coria",                 lat: 39.9836, lng: -6.5371 },
  // ── País Vasco / Cantabria / Asturias ────────────────────────────────
  { code: "33024", name: "Gijón",                 lat: 43.5453, lng: -5.6619 },
  { code: "33002", name: "Avilés",                lat: 43.5547, lng: -5.9248 },
  { code: "01059", name: "Vitoria-Gasteiz",       lat: 42.8467, lng: -2.6716 },
  { code: "39087", name: "Torrelavega",           lat: 43.3534, lng: -4.0511 },
  { code: "39021", name: "Castro-Urdiales",       lat: 43.3839, lng: -3.2169 },
];

const MAX_DISTANCE_KM = 80; // si el más cercano AEMET está a >80km, usar solo Open-Meteo

/** Distancia haversine aproximada en km entre dos puntos (suficiente para ranking). */
function approxDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/**
 * Devuelve el municipio AEMET más cercano y su distancia en km.
 * Si la distancia supera MAX_DISTANCE_KM, el llamador debería caer a Open-Meteo.
 */
function findNearestMunicipio(lat: number, lng: number): { code: string; name: string; distanceKm: number } {
  let best = MUNICIPIOS_AEMET[0];
  let bestDist = Infinity;
  for (const m of MUNICIPIOS_AEMET) {
    const d = approxDistanceKm(lat, lng, m.lat, m.lng);
    if (d < bestDist) { bestDist = d; best = m; }
  }
  return { code: best.code, name: best.name, distanceKm: bestDist };
}

/**
 * Fetch daily weather forecast from AEMET + Open-Meteo supplement + NOAA KP.
 * AEMET: temperatura, viento, precipitación, estado cielo (España oficial).
 * Open-Meteo: humedad, ráfagas, UV, visibilidad, nubosidad %, amanecer, ocaso.
 * NOAA SWPC: KP index (actividad geomagnética → GPS/RTK).
 */
export async function getWeatherForLocation(
  lat: number,
  lng: number,
  date?: string,
): Promise<WeatherForecast> {
  const apiKey = process.env.AEMET_API_KEY;
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const municipio = findNearestMunicipio(lat, lng);
  const aemetCovers = municipio.distanceKm <= MAX_DISTANCE_KM;

  // Open-Meteo + KP en paralelo (independientes de AEMET, no bloquean si AEMET no está)
  const supplementPromise = fetchOpenMeteoSupplement(lat, lng);

  // Etiqueta de ubicación: si el municipio AEMET cubre, usamos su nombre.
  // Si no, mostramos las coordenadas para no mentir con un "Madrid" lejano.
  const locationLabel = aemetCovers
    ? municipio.name
    : `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

  let baseForecast: WeatherForecast;

  if (!apiKey || !aemetCovers) {
    // Sin API key o fuera de cobertura AEMET → forecast primario desde Open-Meteo
    // (es global y siempre tiene datos; si también falla → fallback estacional).
    baseForecast = await fetchOpenMeteoPrimary(lat, lng, locationLabel, targetDate);
  } else {
    try {
      // Step 1: Get data URL
      const indexRes = await fetch(
        `${AEMET_BASE}/prediccion/especifica/municipio/diaria/${municipio.code}`,
        {
          headers: { api_key: apiKey },
          next: { revalidate: 3600 },
        },
      );

      if (!indexRes.ok) {
        console.error(`AEMET index failed: ${indexRes.status}`);
        baseForecast = await fetchOpenMeteoPrimary(lat, lng, locationLabel, targetDate);
      } else {
        const index = await indexRes.json() as { estado: number; datos: string };
        if (index.estado !== 200 || !index.datos) {
          baseForecast = await fetchOpenMeteoPrimary(lat, lng, locationLabel, targetDate);
        } else {
          const dataRes = await fetch(index.datos, { next: { revalidate: 3600 } });
          if (!dataRes.ok) {
            baseForecast = await fetchOpenMeteoPrimary(lat, lng, locationLabel, targetDate);
          } else {
            const data = await dataRes.json() as AemetPrediccion[];
            baseForecast = parseAemetForecast(data, locationLabel, targetDate);
          }
        }
      }
    } catch (err) {
      console.error("AEMET fetch error:", err);
      baseForecast = await fetchOpenMeteoPrimary(lat, lng, locationLabel, targetDate);
    }
  }

  // Mergea con supplement (best-effort, no bloquea si falla)
  const supplement = await supplementPromise;
  return { ...baseForecast, ...supplement };
}

// ── Open-Meteo primary (cuando AEMET no aplica) ─────────────────────────────

/**
 * Forecast diario completo desde Open-Meteo. Se usa cuando:
 *  - No hay AEMET_API_KEY configurada
 *  - El municipio AEMET más cercano está a >MAX_DISTANCE_KM
 *  - AEMET falla por cualquier motivo
 *
 * Open-Meteo es gratuito, sin key, mundial. Siempre tiene cobertura.
 */
async function fetchOpenMeteoPrimary(
  lat: number,
  lng: number,
  label: string,
  targetDate: string,
): Promise<WeatherForecast> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
      `wind_speed_10m_max,wind_direction_10m_dominant,weather_code` +
      `&wind_speed_unit=kmh&timezone=auto&forecast_days=7`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return generateFallbackForecast(label, targetDate);

    type OMDaily = {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_probability_max?: number[];
      wind_speed_10m_max?: number[];
      wind_direction_10m_dominant?: number[];
      weather_code?: number[];
    };
    const json = await res.json() as { daily?: OMDaily };
    const d = json.daily;
    if (!d?.time || d.time.length === 0) return generateFallbackForecast(label, targetDate);

    const idx = d.time.findIndex((t) => t.startsWith(targetDate));
    const i = idx >= 0 ? idx : 0;

    const tmax = d.temperature_2m_max?.[i] ?? 20;
    const tmin = d.temperature_2m_min?.[i] ?? 10;
    const precip = d.precipitation_probability_max?.[i] ?? 0;
    const windKmh = Math.round(d.wind_speed_10m_max?.[i] ?? 0);
    const windDirDeg = d.wind_direction_10m_dominant?.[i] ?? 0;
    const wmoCode = d.weather_code?.[i] ?? 0;

    const { aptoVuelo, razon } = evaluateFlightConditions(windKmh, precip, tmin, tmax);
    const { code: estadoCielo, desc: estadoCieloDesc } = wmoToCielo(wmoCode);

    return {
      source: "fallback", // marcamos como fallback (no es AEMET oficial)
      municipio: label,
      fecha: targetDate,
      temperatura: { min: Math.round(tmin), max: Math.round(tmax) },
      viento: { velocidad: windKmh, direccion: degToCardinal(windDirDeg) },
      precipitacion: precip,
      estadoCielo,
      estadoCieloDesc,
      aptoVuelo,
      razon,
    };
  } catch (err) {
    console.error("Open-Meteo primary fetch error:", err);
    return generateFallbackForecast(label, targetDate);
  }
}

/** Convierte grados (0-360) a punto cardinal (N, NE, E, SE, S, SW, W, NW). */
function degToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

/**
 * WMO weather code → estado cielo (formato compatible con AEMET).
 * https://open-meteo.com/en/docs#weather-variable-documentation
 */
function wmoToCielo(code: number): { code: string; desc: string } {
  if (code === 0) return { code: "11", desc: "Despejado" };
  if (code <= 2) return { code: "12", desc: "Poco nuboso" };
  if (code === 3) return { code: "14", desc: "Nuboso" };
  if (code <= 48) return { code: "82", desc: "Niebla" };
  if (code <= 57) return { code: "43", desc: "Llovizna" };
  if (code <= 65) return { code: "23", desc: "Lluvia" };
  if (code <= 67) return { code: "33", desc: "Lluvia helada" };
  if (code <= 77) return { code: "33", desc: "Nieve" };
  if (code <= 82) return { code: "24", desc: "Chubascos" };
  if (code <= 86) return { code: "35", desc: "Chubascos de nieve" };
  if (code <= 99) return { code: "52", desc: "Tormenta" };
  return { code: "", desc: "Sin datos" };
}

// ── Open-Meteo + NOAA supplement ────────────────────────────────────────────

type WeatherSupplement = Pick<WeatherForecast,
  "humedad" | "rafagas" | "visibilidad" | "nubosidad" | "uvIndex" |
  "amanecer" | "ocaso" | "kpIndex" | "kpStatus"
>;

async function fetchOpenMeteoSupplement(lat: number, lng: number): Promise<WeatherSupplement> {
  const empty: WeatherSupplement = {
    humedad: null, rafagas: null, visibilidad: null, nubosidad: null,
    uvIndex: null, amanecer: null, ocaso: null, kpIndex: null, kpStatus: null,
  };

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=relative_humidity_2m,wind_gusts_10m,uv_index,visibility,cloud_cover` +
      `&daily=sunrise,sunset` +
      `&wind_speed_unit=kmh&timezone=auto`;

    const [omRes, kpRes] = await Promise.all([
      fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 1800 } }),
      fetchKPIndex(),
    ]);

    if (!omRes.ok) return { ...empty, kpIndex: kpRes.kpIndex, kpStatus: kpRes.kpStatus };

    type OpenMeteoCurrent = {
      relative_humidity_2m?: number;
      wind_gusts_10m?: number;
      uv_index?: number;
      visibility?: number;
      cloud_cover?: number;
    };
    const om = await omRes.json() as {
      current?: OpenMeteoCurrent;
      daily?: { sunrise?: string[]; sunset?: string[] };
    };
    const c = om.current ?? {};

    return {
      humedad: c.relative_humidity_2m ?? null,
      rafagas: c.wind_gusts_10m != null ? Math.round(c.wind_gusts_10m) : null,
      visibilidad: c.visibility != null ? Math.round(c.visibility / 100) / 10 : null, // metros → km (1 decimal)
      nubosidad: c.cloud_cover ?? null,
      uvIndex: c.uv_index != null ? Math.round(c.uv_index * 10) / 10 : null,
      amanecer: fmtIsoTime(om.daily?.sunrise?.[0]),
      ocaso: fmtIsoTime(om.daily?.sunset?.[0]),
      kpIndex: kpRes.kpIndex,
      kpStatus: kpRes.kpStatus,
    };
  } catch {
    return empty;
  }
}

/** NOAA Planetary KP Index — afecta a GPS/RTK. */
async function fetchKPIndex(): Promise<{ kpIndex: number | null; kpStatus: "optimo" | "degradado" | "inestable" | null }> {
  try {
    const r = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
      { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } },
    );
    if (!r.ok) return { kpIndex: null, kpStatus: null };
    const data = await r.json() as Array<unknown>;
    if (!Array.isArray(data) || data.length < 2) return { kpIndex: null, kpStatus: null };
    // NOAA legacy format: first row = headers, rest = arrays [time_tag, Kp, ...]
    const latest = data[data.length - 1];
    const kp = Array.isArray(latest)
      ? parseFloat(String(latest[1]))
      : parseFloat(String((latest as { Kp?: string }).Kp));
    if (isNaN(kp)) return { kpIndex: null, kpStatus: null };
    const status: "optimo" | "degradado" | "inestable" =
      kp < 4 ? "optimo" : kp < 6 ? "degradado" : "inestable";
    return { kpIndex: Math.round(kp * 10) / 10, kpStatus: status };
  } catch {
    return { kpIndex: null, kpStatus: null };
  }
}

/** ISO datetime → HH:MM en hora local (Open-Meteo ya devuelve en TZ del lugar). */
function fmtIsoTime(iso: string | undefined): string | null {
  if (!iso) return null;
  // formato Open-Meteo: "2026-05-04T07:07"
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m?.[1] ?? null;
}

// --- AEMET response parsing ---

type AemetPrediccion = {
  nombre: string;
  prediccion: {
    dia: Array<{
      fecha: string;
      temperatura: { maxima: number; minima: number };
      viento: Array<{ direccion: string; velocidad: number; periodo?: string }>;
      probPrecipitacion: Array<{ value: number; periodo?: string }>;
      estadoCielo: Array<{ value: string; descripcion: string; periodo?: string }>;
    }>;
  };
};

function parseAemetForecast(
  data: AemetPrediccion[],
  municipio: string,
  targetDate: string,
): WeatherForecast {
  const pred = data[0];
  if (!pred?.prediccion?.dia) {
    return generateFallbackForecast(municipio, targetDate);
  }

  // Find the day matching targetDate
  const dayData = pred.prediccion.dia.find((d) =>
    d.fecha.startsWith(targetDate),
  ) ?? pred.prediccion.dia[0];

  if (!dayData) {
    return generateFallbackForecast(municipio, targetDate);
  }

  const temp = dayData.temperatura;
  // Pick wind entry with highest velocity (00-24 aggregate is often empty in AEMET)
  const vientoEntries = dayData.viento ?? [];
  const viento = vientoEntries.reduce(
    (best, v) => (v.velocidad > best.velocidad ? v : best),
    { direccion: "C", velocidad: 0 },
  );
  // Normalize empty direction to Calma
  if (!viento.direccion) viento.direccion = "C";
  const precip = dayData.probPrecipitacion?.reduce(
    (max, p) => Math.max(max, p.value ?? 0), 0,
  ) ?? 0;
  const cielo = dayData.estadoCielo?.find((e) => e.descripcion) ?? {
    value: "",
    descripcion: "Sin datos",
  };

  const windKmh = viento.velocidad;
  const { aptoVuelo, razon } = evaluateFlightConditions(
    windKmh,
    precip,
    temp.minima,
    temp.maxima,
  );

  return {
    source: "aemet",
    municipio,
    fecha: targetDate,
    temperatura: { min: temp.minima, max: temp.maxima },
    viento: { velocidad: windKmh, direccion: viento.direccion },
    precipitacion: precip,
    estadoCielo: cielo.value,
    estadoCieloDesc: cielo.descripcion,
    aptoVuelo,
    razon,
  };
}

// --- Flight condition evaluation ---

function evaluateFlightConditions(
  windKmh: number,
  precipProb: number,
  tempMin: number,
  tempMax: number,
): { aptoVuelo: boolean; razon?: string } {
  const razones: string[] = [];

  // AESA/EASA open category limits
  if (windKmh > 40) razones.push(`Viento excesivo (${windKmh} km/h > 40)`);
  else if (windKmh > 30) razones.push(`Viento fuerte (${windKmh} km/h)`);

  if (precipProb > 60) razones.push(`Alta probabilidad de precipitacion (${precipProb}%)`);

  if (tempMin < 0) razones.push(`Temperatura bajo cero (${tempMin}C)`);
  if (tempMax > 45) razones.push(`Temperatura extrema (${tempMax}C)`);

  if (razones.length === 0) return { aptoVuelo: true };

  // Wind > 40 or precip > 80 = not flyable
  const noFly = windKmh > 40 || precipProb > 80 || tempMin < -5;
  return {
    aptoVuelo: !noFly,
    razon: razones.join(". "),
  };
}

// --- Fallback last-resort (sólo si AEMET y Open-Meteo fallan) ---

function generateFallbackForecast(
  municipio: string,
  targetDate: string,
): WeatherForecast {
  // Defaults estacionales razonables para España (último recurso si todo falla).
  const month = new Date(targetDate).getMonth(); // 0-based
  const isWinter = month <= 1 || month >= 11;
  const isSummer = month >= 5 && month <= 8;

  return {
    source: "fallback",
    municipio,
    fecha: targetDate,
    temperatura: {
      min: isWinter ? 3 : isSummer ? 18 : 10,
      max: isWinter ? 12 : isSummer ? 38 : 22,
    },
    viento: { velocidad: 15, direccion: "SW" },
    precipitacion: isWinter ? 40 : isSummer ? 5 : 25,
    estadoCielo: isSummer ? "despejado" : "nuboso",
    estadoCieloDesc: isSummer ? "Despejado" : isWinter ? "Nuboso" : "Poco nuboso",
    aptoVuelo: true,
    razon: undefined,
  };
}
