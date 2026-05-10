/**
 * Parsers de coordenadas geográficas — soporta decimal y DMS.
 *
 * Decimal:  "39.4699"  /  "-6.3722"
 * DMS:      `36°25'04.88"N`  /  `5°09'13.11"W`  (variantes con espacios y sin
 *           segundos opcionales)
 *
 * Hemisferios: N/n y E/e → positivo; S/s y W/O/w/o → negativo.
 *
 * `parseCoordPair` detecta automáticamente el orden lat/lng (incluso si está
 * invertido — común en KMZ/GeoJSON) usando los rangos terrestres válidos.
 */

/** Devuelve grados decimales si el input es DMS, o null si no matchea. */
export function parseDMS(text: string): number | null {
  // Tolera símbolos típicos: ° ' " ′ ″ y también " (escape de char)
  const re = /^\s*(\d+(?:\.\d+)?)\s*[°º]?\s*(?:(\d+(?:\.\d+)?)\s*['′]?)?\s*(?:(\d+(?:\.\d+)?)\s*["″]?)?\s*([NSEWOnsewo])\s*$/;
  const m = text.trim().match(re);
  if (!m) return null;
  const deg = parseFloat(m[1]);
  const min = m[2] ? parseFloat(m[2]) : 0;
  const sec = m[3] ? parseFloat(m[3]) : 0;
  const hem = m[4].toUpperCase();
  if (isNaN(deg) || isNaN(min) || isNaN(sec)) return null;
  if (min >= 60 || sec >= 60) return null;
  let val = deg + min / 60 + sec / 3600;
  if (hem === "S" || hem === "W" || hem === "O") val = -val;
  return val;
}

/** Devuelve número si el input es decimal puro (con signo opcional). */
export function parseDecimal(text: string): number | null {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return isNaN(v) ? null : v;
}

/** Intenta parsear una coordenada individual: primero DMS, luego decimal. */
export function parseCoordinate(text: string): number | null {
  return parseDMS(text) ?? parseDecimal(text);
}

/**
 * Parsea un par de coordenadas "lat lng" detectando varios separadores y
 * el orden (incluyendo orden invertido tipo KMZ).
 *
 * Acepta combinaciones:
 *   "39.4699, -6.3722"
 *   "39.4699; -6.3722"
 *   "39.4699 -6.3722"
 *   `36°25'04.88"N 5°09'13.11"W`
 *   `36°25'04.88"N, 5°09'13.11"W`
 *   `5°09'13.11"W, 36°25'04.88"N`  (orden invertido)
 *
 * Devuelve null si no encaja en rangos terrestres en ningún orden.
 */
export function parseCoordPair(text: string): { lat: number; lng: number } | null {
  const t = text.trim();
  if (!t) return null;

  // Estrategia: primero busca patrones DMS (que tienen letras N/S/E/W/O y
  // por tanto son inequívocos), luego decimal con separadores.

  // 1. Dos DMS separados por coma/punto y coma/espacio
  const dmsPair = t.match(
    /^(.+?[NSEWOnsewo])\s*[,;]?\s+(.+?[NSEWOnsewo])\s*$/,
  );
  if (dmsPair) {
    const a = parseDMS(dmsPair[1]);
    const b = parseDMS(dmsPair[2]);
    if (a !== null && b !== null) {
      // Hemisferios determinan qué es lat/lng:
      //   N/S → latitud
      //   E/W/O → longitud
      const aHem = dmsPair[1].trim().slice(-1).toUpperCase();
      const bHem = dmsPair[2].trim().slice(-1).toUpperCase();
      if ((aHem === "N" || aHem === "S") && (bHem === "E" || bHem === "W" || bHem === "O")) {
        return { lat: a, lng: b };
      }
      if ((bHem === "N" || bHem === "S") && (aHem === "E" || aHem === "W" || aHem === "O")) {
        return { lat: b, lng: a };
      }
    }
  }

  // 2. Decimal pair (con coma, punto y coma o espacio)
  const decPair = t.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (decPair) {
    const a = parseFloat(decPair[1]);
    const b = parseFloat(decPair[2]);
    if (!isNaN(a) && !isNaN(b)) {
      // Auto-detect order
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b };
      if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return { lat: b, lng: a };
    }
  }

  return null;
}

/**
 * Validador para el schema Zod: convierte a string decimal canónico.
 * Devuelve undefined si el input está vacío, null o undefined.
 * Lanza si el formato no es parseable a coordenada terrestre válida.
 */
export function coerceCoordinateString(input: unknown, kind: "lat" | "lng"): string | undefined {
  if (input === "" || input === null || input === undefined) return undefined;
  if (typeof input === "number") {
    if (isNaN(input)) throw new Error(`${kind} no es un número válido`);
    return String(input);
  }
  if (typeof input !== "string") {
    throw new Error(`${kind} debe ser texto o número`);
  }
  const parsed = parseCoordinate(input);
  if (parsed === null) {
    throw new Error(
      `Formato de ${kind === "lat" ? "latitud" : "longitud"} inválido. ` +
      `Usa decimal (39.4699) o DMS (36°25'04.88"N).`,
    );
  }
  const max = kind === "lat" ? 90 : 180;
  if (Math.abs(parsed) > max) {
    throw new Error(
      `${kind === "lat" ? "Latitud" : "Longitud"} fuera de rango (debe estar entre -${max} y ${max}).`,
    );
  }
  return String(parsed);
}
