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

// AEMET municipality codes for Extremadura provinces (nearest to coordinates)
const MUNICIPIOS_EXTREMADURA: Record<string, { code: string; name: string }> = {
  caceres: { code: "10037", name: "Caceres" },
  badajoz: { code: "06015", name: "Badajoz" },
  merida: { code: "06083", name: "Merida" },
  plasencia: { code: "10148", name: "Plasencia" },
  trujillo: { code: "10195", name: "Trujillo" },
  almendralejo: { code: "06011", name: "Almendralejo" },
  don_benito: { code: "06044", name: "Don Benito" },
  zafra: { code: "06158", name: "Zafra" },
  navalmoral: { code: "10131", name: "Navalmoral de la Mata" },
  coria: { code: "10067", name: "Coria" },
};

/**
 * Find nearest AEMET municipality for given coordinates.
 * Simple distance approximation — good enough for Extremadura.
 */
const MUNICIPIO_COORDS: Record<string, [number, number]> = {
  caceres: [39.4753, -6.3724],
  badajoz: [38.8794, -6.9707],
  merida: [38.9160, -6.3438],
  plasencia: [40.0302, -6.0887],
  trujillo: [39.4588, -5.8819],
  almendralejo: [38.6830, -6.4074],
  don_benito: [38.9550, -5.8601],
  zafra: [38.4168, -6.4182],
  navalmoral: [39.8917, -5.5407],
  coria: [39.9836, -6.5371],
};

function findNearestMunicipio(lat: number, lng: number): { code: string; name: string } {
  let nearest = "caceres";
  let minDist = Infinity;

  for (const [key, [mlat, mlng]] of Object.entries(MUNICIPIO_COORDS)) {
    const dist = Math.sqrt((lat - mlat) ** 2 + (lng - mlng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = key;
    }
  }

  return MUNICIPIOS_EXTREMADURA[nearest]!;
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

  // Open-Meteo + KP en paralelo (independientes de AEMET, no bloquean si AEMET no está)
  const supplementPromise = fetchOpenMeteoSupplement(lat, lng);

  let baseForecast: WeatherForecast;

  if (!apiKey) {
    baseForecast = generateFallbackForecast(municipio.name, targetDate);
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
        baseForecast = generateFallbackForecast(municipio.name, targetDate);
      } else {
        const index = await indexRes.json() as { estado: number; datos: string };
        if (index.estado !== 200 || !index.datos) {
          baseForecast = generateFallbackForecast(municipio.name, targetDate);
        } else {
          const dataRes = await fetch(index.datos, { next: { revalidate: 3600 } });
          if (!dataRes.ok) {
            baseForecast = generateFallbackForecast(municipio.name, targetDate);
          } else {
            const data = await dataRes.json() as AemetPrediccion[];
            baseForecast = parseAemetForecast(data, municipio.name, targetDate);
          }
        }
      }
    } catch (err) {
      console.error("AEMET fetch error:", err);
      baseForecast = generateFallbackForecast(municipio.name, targetDate);
    }
  }

  // Mergea con supplement (best-effort, no bloquea si falla)
  const supplement = await supplementPromise;
  return { ...baseForecast, ...supplement };
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

// --- Fallback when no API key ---

function generateFallbackForecast(
  municipio: string,
  targetDate: string,
): WeatherForecast {
  // Return reasonable Extremadura defaults for the season
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
