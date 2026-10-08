/**
 * AESA (Agencia Estatal de Seguridad Aerea) integration.
 *
 * AESA no publica API REST publica para operadores (a Apr 2026).
 * Esta implementacion aplica validacion de formato oficial + consulta BOE.
 *
 * Fuentes oficiales:
 * - Formato operador UAS: ES.UAS.YYYY.NNNN (Reglamento UE 2019/947, Art. 14)
 * - Formato licencia A1/A3: certificado por entidad habilitada AESA
 * - Formato licencia A2: expedida por AESA, prefijo ESP-UAS-PIL-
 * - Formato RPAS (legacy pre-2021): ESP-RPAS-NNNNNN
 * - STS-01/STS-02: resoluciones publicadas en BOE
 */

// ─── Format patterns ─────────────────────────────────────────────────────────

/**
 * Numero de operador UAS (registro de operador, no del dron).
 * Formato: ES.UAS.YYYY.NNNN  (ej: ES.UAS.2024.0341)
 * Tambien aceptado con guiones: ES-UAS-2024-0341
 */
const UAS_REGISTRATION_RE = /^ES[.\-]UAS[.\-]\d{4}[.\-]\d{4}$/i;

/**
 * Numero de matricula individual de aeronave no tripulada.
 * Formato: ES.UAS.IMMAT.YYYY.NNNNNN (menos comun, para drones >25kg)
 */
const UAS_IMMAT_RE = /^ES[.\-]UAS[.\-]IMMAT[.\-]\d{4}[.\-]\d+$/i;

/**
 * Licencia de piloto categoria A2 expedida por AESA.
 * Formato: ESP-UAS-PIL-NNNNNN  (ej: ESP-UAS-PIL-2019-0034)
 */
const PILOT_A2_RE = /^ESP-UAS-PIL-[\d-]+$/i;

/**
 * Certificado de competencia A1/A3 (expedido por entidad habilitada).
 * AESA no estandariza el numero; validamos que no este vacio y sea alfanumerico.
 */
const PILOT_A1A3_RE = /^[A-Z0-9][\w\-/]{4,}$/i;

/**
 * Piloto RPAS (habilitacion pre-2021, aun valida para muchos operadores).
 * Formato: ESP-RPAS-NNNNNN  o  ESP-RPAS-NNN
 */
const PILOT_RPAS_RE = /^ESP-RPAS-[\d-]+$/i;

/**
 * Escenarios estandar (STS-01, STS-02) — numero de resolucion BOE.
 * Formato libre, se valida que mencione STS.
 */
const STS_RE = /STS-0[12]/i;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AesaFormatValidation = {
  raw: string;
  normalized: string;
  valid: boolean;
  formatType:
    | "uas_registration"
    | "uas_immat"
    | "pilot_a2"
    | "pilot_a1a3"
    | "pilot_rpas"
    | "sts"
    | "unknown";
  hint?: string;
};

// ─── Format validation ────────────────────────────────────────────────────────

export function validateAesaRegistrationFormat(raw: string): AesaFormatValidation {
  const normalized = raw.trim().toUpperCase();

  if (UAS_REGISTRATION_RE.test(normalized)) {
    // Extract year and validate plausibility
    const parts = normalized.replace(/-/g, ".").split(".");
    const year = parseInt(parts[2]);
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return {
        raw, normalized, valid: false,
        formatType: "uas_registration",
        hint: `Año ${year} fuera de rango valido (2020-${new Date().getFullYear() + 1})`,
      };
    }
    return { raw, normalized, valid: true, formatType: "uas_registration" };
  }

  if (UAS_IMMAT_RE.test(normalized)) {
    return { raw, normalized, valid: true, formatType: "uas_immat" };
  }

  return {
    raw, normalized, valid: false,
    formatType: "unknown",
    hint: "Formato esperado: ES.UAS.YYYY.NNNN (ej: ES.UAS.2024.0341)",
  };
}

export function validateAesaPilotFormat(raw: string): AesaFormatValidation {
  const normalized = raw.trim().toUpperCase();

  if (PILOT_A2_RE.test(normalized)) {
    return { raw, normalized, valid: true, formatType: "pilot_a2" };
  }

  if (PILOT_RPAS_RE.test(normalized)) {
    return { raw, normalized, valid: true, formatType: "pilot_rpas" };
  }

  if (STS_RE.test(normalized)) {
    return { raw, normalized, valid: true, formatType: "sts" };
  }

  if (PILOT_A1A3_RE.test(normalized)) {
    // A1/A3 certs have no fixed format — accept if reasonably structured
    return {
      raw, normalized, valid: true, formatType: "pilot_a1a3",
      hint: "Certificado A1/A3 — formato libre (expedido por entidad habilitada)",
    };
  }

  return {
    raw, normalized, valid: false,
    formatType: "unknown",
    hint: "Formatos validos: ESP-UAS-PIL-NNNNNN (A2) | ESP-RPAS-NNNNNN (RPAS legacy)",
  };
}
