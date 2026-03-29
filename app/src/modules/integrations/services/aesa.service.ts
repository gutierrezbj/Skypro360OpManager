/**
 * AESA (Agencia Estatal de Seguridad Aerea) API integration stub.
 *
 * Future integration points:
 * - UAS registration verification
 * - Pilot license validation
 * - Flight authorization requests (specific category)
 * - Incident reporting submission
 * - NOTAM queries (via ENAIRE)
 *
 * Currently returns mock data. Replace with real API calls
 * when AESA publishes their REST API for operators.
 */

export type AesaRegistrationStatus = {
  registrationNumber: string;
  status: "valid" | "expired" | "suspended" | "not_found";
  operatorName?: string;
  easaClass?: string;
  expiryDate?: string;
  lastChecked: string;
};

export type AesaPilotStatus = {
  licenseNumber: string;
  status: "valid" | "expired" | "suspended" | "not_found";
  pilotName?: string;
  categories?: string[];
  expiryDate?: string;
  lastChecked: string;
};

export type AesaFlightAuth = {
  authId: string;
  status: "pending" | "approved" | "denied" | "expired";
  missionCode: string;
  validFrom?: string;
  validUntil?: string;
  conditions?: string[];
  submittedAt: string;
};

/**
 * Verify a UAS registration number against AESA registry.
 * STUB: Returns mock data until AESA API is available.
 */
export async function verifyUasRegistration(
  registrationNumber: string,
): Promise<AesaRegistrationStatus> {
  // TODO: Replace with real AESA API call
  // const apiKey = process.env.AESA_API_KEY;
  // const res = await fetch(`${AESA_BASE}/uas/verify/${registrationNumber}`, { ... });

  await simulateLatency();

  // Mock: treat ES.UAS prefixed numbers as valid
  if (registrationNumber.startsWith("ES.UAS.") || registrationNumber.startsWith("ES-UAS-")) {
    return {
      registrationNumber,
      status: "valid",
      operatorName: "Skypro360 S.L.",
      easaClass: "C2",
      expiryDate: "2027-06-30",
      lastChecked: new Date().toISOString(),
    };
  }

  return {
    registrationNumber,
    status: "not_found",
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Validate a pilot license against AESA records.
 * STUB: Returns mock data until AESA API is available.
 */
export async function validatePilotLicense(
  licenseNumber: string,
): Promise<AesaPilotStatus> {
  await simulateLatency();

  if (licenseNumber.startsWith("ESP-UAS-PIL-") || licenseNumber.startsWith("ESP-RPAS-")) {
    return {
      licenseNumber,
      status: "valid",
      categories: ["A1/A3", "A2", "STS-01", "STS-02"],
      expiryDate: "2027-12-31",
      lastChecked: new Date().toISOString(),
    };
  }

  return {
    licenseNumber,
    status: "not_found",
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Submit a flight authorization request for specific category operations.
 * STUB: Returns mock pending authorization.
 */
export async function requestFlightAuthorization(params: {
  missionCode: string;
  operationType: string;
  soraClass: string;
  location: { lat: number; lng: number };
  scheduledStart: string;
  scheduledEnd: string;
  maxAltitude: number;
}): Promise<AesaFlightAuth> {
  await simulateLatency();

  return {
    authId: `AESA-AUTH-${Date.now()}`,
    status: "pending",
    missionCode: params.missionCode,
    submittedAt: new Date().toISOString(),
    conditions: [
      "Operacion limitada a VLOS",
      `Altitud maxima: ${params.maxAltitude}m AGL`,
      "Notificar a TWR si dentro de CTR",
    ],
  };
}

/**
 * Submit an incident report to AESA.
 * STUB: Returns success acknowledgment.
 */
export async function submitIncidentReport(params: {
  missionCode: string;
  incidentType: string;
  description: string;
  date: string;
  location: { lat: number; lng: number };
}): Promise<{ reportId: string; status: string }> {
  await simulateLatency();

  return {
    reportId: `AESA-INC-${Date.now()}`,
    status: "received",
  };
}

// Simulate network latency for stubs
function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 200));
}
