/**
 * Integrations module — external API connections.
 *
 * Services:
 * - AEMET: Weather forecasts for mission planning
 * - AESA: UAS registration & pilot license verification (stub)
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
} from "./services/aesa.service";
