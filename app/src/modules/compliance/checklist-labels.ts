/**
 * Diccionario centralizado de etiquetas de checklists AESA en español.
 *
 * Las claves snake_case se usan como identificadores en la BD (jsonb),
 * pero al renderizar (panel compliance, PDF dossier) hay que mostrar
 * la etiqueta en español. Este archivo es la fuente única de verdad.
 *
 * Si añades una nueva clave en algún checklist, añádela también aquí.
 */

export const CHECKLIST_LABELS: Record<string, string> = {
  // ── Planning A.4 ──────────────────────────────────────────────────────────
  geo_zones:           "Zonas geográficas verificadas (0.4)",
  airspace_check:      "Espacio aéreo consultado",
  notam_check:         "NOTAMs revisados",
  weather_check:       "Previsión meteorológica consultada",
  earo_coordinated:    "Coordinación EARO completada (si aplica)",
  flight_zone_req:     "Requisitos zona de vuelo verificados (0.6)",
  risk_mitigation:     "Medidas de mitigación de riesgos definidas",
  emergency_plan:      "Plan de emergencia revisado",

  // ── Pre-flight A.5 (operacional) ──────────────────────────────────────────
  crew_briefing:        "Briefing de tripulación completado",
  crew_fit:             "Estado físico/mental de la tripulación OK",
  authorizations:       "Autorizaciones y permisos verificados",
  airspace_confirmed:   "Espacio aéreo confirmado libre",
  notam_current:        "NOTAMs actualizados y revisados",
  comms_check:          "Comunicaciones verificadas",
  emergency_procedures: "Procedimientos de emergencia revisados",
  flight_zone_clear:    "Zona de vuelo despejada y segura",
  spectators_managed:   "Control de espectadores establecido",
  takeoff_landing_clear: "Área despegue/aterrizaje verificada",

  // ── Pre-flight A.6 (técnico UAS) ──────────────────────────────────────────
  uas_visual_inspection: "Inspección visual UAS completada",
  propellers_ok:         "Hélices sin daño, correctamente montadas",
  battery_charged:       "Batería cargada y en buen estado",
  battery_voltage:       "Voltaje de batería dentro de rango",
  gps_fix:               "Señal GPS adquirida (>8 satélites)",
  compass_calibrated:    "Compás calibrado",
  camera_payload:        "Cámara/carga útil asegurada",
  firmware_current:      "Firmware actualizado",
  failsafe_configured:   "Failsafe configurado (RTH)",
  rc_link:               "Enlace RC verificado",
  motors_test:           "Test de motores completado",

  // ── Post-flight A.7 (estado UAS) ──────────────────────────────────────────
  uas_landed_safely:     "UAS aterrizado de forma segura",
  structure_inspection:  "Estructura del UAS inspeccionada",
  propellers_condition:  "Estado de hélices revisado",
  motors_inspection:     "Motores sin anomalías",
  payload_secured:       "Carga útil retirada y asegurada",
  battery_removed:       "Batería retirada y almacenada correctamente",
  damage_detected:       "Sin daños detectados (desmarcar si hay daños)",
  uas_stored:            "UAS guardado en su estuche/caja",

  // ── Post-flight A.8 (cierre operativo) ────────────────────────────────────
  atsp_notified:           "ATSP notificado del fin de operaciones",
  flight_times_recorded:   "Tiempos de vuelo registrados",
  data_downloaded:         "Datos de vuelo descargados",
  media_backed_up:         "Fotos/vídeo respaldados",
  area_cleared:            "Zona de operaciones despejada",
  safety_equipment_collected: "Equipo de seguridad recogido",
  incidents_documented:    "Incidencias documentadas (si aplica)",
  debrief_completed:       "Debrief de equipo completado",
};

/** Devuelve la etiqueta en español o, si la clave es desconocida, una versión legible. */
export function getChecklistLabel(key: string): string {
  return CHECKLIST_LABELS[key] ?? key.replace(/_/g, " ");
}
