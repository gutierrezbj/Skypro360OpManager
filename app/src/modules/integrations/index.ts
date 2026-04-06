/**
 * Integrations module — external API connections.
 *
 * Services:
 * - AEMET: Weather forecasts for mission planning
 * - AESA: UAS/pilot format validation + AESA portal links
 * - BOE: Boletin Oficial del Estado search (operadores/pilotos habilitados)
 */
export { getWeatherForLocation } from "./services/aemet.service";
export type { WeatherForecast } from "./services/aemet.service";

export {
  verifyUasRegistration,
  validatePilotLicense,
  requestFlightAuthorization,
  submitIncidentReport,
} from "./services/aesa.service";
export type {
  AesaRegistrationStatus,
  AesaPilotStatus,
  AesaFlightAuth,
  AesaFormatValidation,
} from "./services/aesa.service";
export {
  validateAesaRegistrationFormat,
  validateAesaPilotFormat,
} from "./services/aesa.service";

export {
  searchBoeForOperator,
  searchBoeForPilot,
  searchBoeAesaUasNews,
} from "./services/boe.service";
export type { BoeDocument, BoeSearchResult } from "./services/boe.service";
