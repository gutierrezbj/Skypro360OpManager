import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  Mission,
  Drone,
  Pilot,
  Tenant,
  FormPlanning,
  FormPreflight,
  FormPostflight,
  FormIncident,
} from "@/lib/db/schema";

type DossierData = {
  mission: Mission;
  drone: Drone | null;
  pilot: { pilot: Pilot; userName: string } | null;
  tenant: Tenant;
  planning: FormPlanning | null;
  preflights: FormPreflight[];
  postflights: FormPostflight[];
  incidents: FormIncident[];
};

export async function generateMissionDossierPdf(data: DossierData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const lineHeight = 14;
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);
  const blue = rgb(0.2, 0.3, 0.7);

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function addPage() {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  function checkSpace(needed: number) {
    if (y - needed < margin) addPage();
  }

  function drawText(text: string, opts: { x?: number; size?: number; font?: typeof font; color?: typeof black } = {}) {
    const { x = margin, size = 9, font: f = font, color = black } = opts;
    checkSpace(lineHeight);
    page.drawText(text, { x, y, size, font: f, color });
    y -= lineHeight;
  }

  function drawTitle(text: string) {
    checkSpace(30);
    y -= 8;
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: pageWidth - margin, y: y + 4 }, thickness: 0.5, color: gray });
    y -= 4;
    drawText(text, { size: 12, font: fontBold, color: blue });
    y -= 4;
  }

  function drawField(label: string, value: string | null | undefined) {
    checkSpace(lineHeight);
    page.drawText(`${label}:`, { x: margin, y, size: 8, font: fontBold, color: gray });
    page.drawText(value ?? "—", { x: margin + 120, y, size: 9, font });
    y -= lineHeight;
  }

  function drawChecklist(jsonData: Record<string, unknown> | null | undefined) {
    if (!jsonData || typeof jsonData !== "object") return;
    for (const [key, val] of Object.entries(jsonData)) {
      checkSpace(lineHeight);
      const checked = val === true;
      const label = key.replace(/_/g, " ");
      page.drawText(checked ? "[X]" : "[ ]", { x: margin + 10, y, size: 8, font: fontMono });
      page.drawText(label, { x: margin + 35, y, size: 8, font, color: checked ? black : gray });
      y -= lineHeight;
    }
  }

  async function drawSignature(sigData: string | null | undefined, label: string) {
    if (!sigData || !sigData.startsWith("data:image")) return;
    checkSpace(60);
    drawText(`${label}:`, { size: 8, font: fontBold, color: gray });
    try {
      const base64 = sigData.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const img = await doc.embedPng(bytes);
      const scale = 80 / img.height;
      page.drawImage(img, { x: margin, y: y - 40, width: img.width * scale, height: 40 });
      y -= 50;
    } catch {
      drawText("(firma no disponible)", { size: 8, color: gray });
    }
  }

  // === COVER ===
  y -= 50;
  drawText("DOSSIER DE MISION AESA", { size: 20, font: fontBold, color: blue });
  y -= 8;

  // ── Cabecera operador (datos AESA) ──
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.7, color: blue });
  y -= 14;
  drawText(data.tenant.name, { size: 14, font: fontBold });
  if (data.tenant.legalName && data.tenant.legalName !== data.tenant.name) {
    drawText(data.tenant.legalName, { size: 9, color: gray });
  }
  y -= 4;
  if (data.tenant.nif) drawField("NIF", data.tenant.nif);
  if (data.tenant.operatorRegistrationNumber) drawField("Reg. operador AESA", data.tenant.operatorRegistrationNumber);
  if (data.tenant.aesaCsv) drawField("CSV verificacion", data.tenant.aesaCsv);
  if (data.tenant.contactEmail) drawField("Contacto", data.tenant.contactEmail);
  y -= 4;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: gray });
  y -= 16;

  drawText("DATOS DE LA MISION", { size: 11, font: fontBold, color: blue });
  y -= 4;

  drawField("Codigo expediente", data.mission.code);
  drawField("Mision", data.mission.name);
  drawField("Estado", data.mission.status);
  drawField("Prioridad", data.mission.priority);
  drawField("SORA", data.mission.soraClass);
  drawField("EARO", data.mission.earoReference);
  drawField("Altitud max", data.mission.maxAltitude ? `${data.mission.maxAltitude}m` : null);
  drawField("Coordenadas", data.mission.latitude && data.mission.longitude
    ? `${data.mission.latitude}, ${data.mission.longitude}`
    : null);

  y -= 5;
  drawField("Inicio programado", data.mission.scheduledStart?.toLocaleString("es-ES") ?? null);
  drawField("Fin programado", data.mission.scheduledEnd?.toLocaleString("es-ES") ?? null);
  drawField("Inicio real", data.mission.actualStart?.toLocaleString("es-ES") ?? null);
  drawField("Fin real", data.mission.actualEnd?.toLocaleString("es-ES") ?? null);

  y -= 5;
  drawField("Piloto", data.pilot ? `${data.pilot.userName} (${data.pilot.pilot.licenseNumber})` : null);
  drawField("Drone", data.drone ? `${data.drone.model} — ${data.drone.serialNumber}` : null);
  drawField("Matricula", data.drone?.registrationNumber);
  drawField("Clase EASA", data.drone?.easaClass);

  if (data.mission.description) {
    y -= 5;
    drawField("Descripcion", null);
    const words = data.mission.description.split(" ");
    let line = "";
    for (const word of words) {
      if ((line + " " + word).length > 80) {
        drawText(line, { x: margin + 10, size: 8 });
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) drawText(line, { x: margin + 10, size: 8 });
  }

  // === PLANNING A.4 ===
  if (data.planning) {
    drawTitle("PLANIFICACION OPERACIONAL (Apendice A.4)");
    drawField("Nivel de riesgo", data.planning.riskLevel);
    drawField("Tipo operacion", data.planning.operationType);
    drawField("Altitud max plan.", data.planning.maxAltitude);
    drawField("Prevision meteo", data.planning.weatherForecast);
    drawField("RP aprobado", data.planning.rpApproved ? "SI" : "NO");

    y -= 5;
    drawText("Checklist planificacion:", { size: 8, font: fontBold, color: gray });
    drawChecklist(data.planning.jsonData as Record<string, unknown>);

    await drawSignature(data.planning.signatureData, "Firma planificador");
    if (data.planning.rpSignature) {
      await drawSignature(data.planning.rpSignature, "Firma RP");
    }
  }

  // === PREFLIGHT A.5/A.6 ===
  for (let i = 0; i < data.preflights.length; i++) {
    const pf = data.preflights[i];
    drawTitle(`CHECKLIST PRE-VUELO #${i + 1} (Apendice A.5/A.6)`);
    drawField("Fecha", pf.createdAt.toLocaleString("es-ES"));
    drawField("UAS", pf.uasId);
    drawField("Espacio aereo", pf.airspaceStatus);

    const wc = pf.weatherConditions as Record<string, unknown> | null;
    if (wc) {
      drawField("Viento", wc.windSpeed != null ? `${wc.windSpeed} km/h` : null);
      drawField("Temperatura", wc.temperature != null ? `${wc.temperature}°C` : null);
      drawField("Precipitacion", wc.precipitation as string);
      drawField("Visibilidad", wc.visibility as string);
    }

    y -= 5;
    drawText("Verificaciones:", { size: 8, font: fontBold, color: gray });
    drawChecklist(pf.jsonData as Record<string, unknown>);
    await drawSignature(pf.signatureData, "Firma piloto");
  }

  // === POSTFLIGHT A.7/A.8 ===
  for (let i = 0; i < data.postflights.length; i++) {
    const pf = data.postflights[i];
    drawTitle(`CHECKLIST POST-VUELO #${i + 1} (Apendice A.7/A.8)`);
    drawField("Fecha", pf.createdAt.toLocaleString("es-ES"));
    drawField("UAS", pf.uasId);
    drawField("Bateria restante", pf.batteryRemaining);

    y -= 5;
    drawText("Verificaciones:", { size: 8, font: fontBold, color: gray });
    drawChecklist(pf.jsonData as Record<string, unknown>);
    await drawSignature(pf.signatureData, "Firma piloto");
  }

  // === INCIDENTS ===
  if (data.incidents.length > 0) {
    drawTitle("INCIDENTES (Anexo I)");
    for (const inc of data.incidents) {
      checkSpace(80);
      drawField("Tipo", inc.incidentType === "none" ? "Sin incidentes (declaracion formal)" : inc.incidentType.replace(/_/g, " "));
      drawField("Fecha", inc.createdAt.toLocaleString("es-ES"));
      drawField("AESA notificada", inc.aesaNotified ? "SI" : "NO");
      drawField("Descripcion", null);
      const words = inc.description.split(" ");
      let line = "";
      for (const word of words) {
        if ((line + " " + word).length > 80) {
          drawText(line, { x: margin + 10, size: 8 });
          line = word;
        } else {
          line = line ? line + " " + word : word;
        }
      }
      if (line) drawText(line, { x: margin + 10, size: 8 });

      if (inc.actionsTaken) {
        drawField("Acciones", inc.actionsTaken);
      }
      await drawSignature(inc.signatureData, "Firma informante");
      y -= 10;
    }
  }

  // === FOOTER on every page ===
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const footerText = `${data.mission.code} — ${data.tenant.name}${data.tenant.operatorRegistrationNumber ? ` (${data.tenant.operatorRegistrationNumber})` : ""} — Pagina ${i + 1}/${pages.length}`;
    p.drawText(footerText, {
      x: margin,
      y: 25,
      size: 7,
      font: fontMono,
      color: gray,
    });
    p.drawText(`Generado: ${new Date().toLocaleString("es-ES")}`, {
      x: pageWidth - margin - 130,
      y: 25,
      size: 7,
      font: fontMono,
      color: gray,
    });
  }

  return doc.save();
}
