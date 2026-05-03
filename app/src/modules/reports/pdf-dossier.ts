import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
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

// ── Colores corporativos Skypro360 ───────────────────────────────────────────
const BRAND_BLUE = rgb(0.047, 0.624, 0.847); // #0C9FD8
const BRAND_ORANGE = rgb(0.941, 0.306, 0.110); // #F04E1C
const BRAND_DARK = rgb(0.05, 0.07, 0.13); // #0D1320
const TEXT = rgb(0.16, 0.20, 0.27); // body text
const MUTED = rgb(0.42, 0.48, 0.55); // labels
const LINE = rgb(0.85, 0.88, 0.92); // dividers
const SUCCESS = rgb(0, 0.53, 0.29); // #00874A
const DANGER = rgb(0.77, 0.19, 0.19); // #C53030
const WARN = rgb(0.71, 0.52, 0); // #B58500
const SURFACE_TINT = rgb(0.96, 0.97, 0.99); // very light bg for boxes

// ── Layout ───────────────────────────────────────────────────────────────────
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

// El servidor corre en UTC. Forzamos zona horaria Madrid para todo formateo.
const TZ_MADRID = "Europe/Madrid";

function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-ES", {
    timeZone: TZ_MADRID,
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateTimeShort(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-ES", {
    timeZone: TZ_MADRID,
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function generateMissionDossierPdf(data: DossierData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  // Cargar logo (best-effort, no rompe si falta)
  let logoImg: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-skypro360.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImg = await doc.embedPng(logoBytes);
    }
  } catch {
    // ignore — el dossier se genera sin logo
  }

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function addPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    drawHeaderStripe(page);
    y -= 4;
  }

  function checkSpace(needed: number) {
    if (y - needed < MARGIN + 24) addPage();
  }

  // ── Header stripe (fina linea azul + naranja al top de cada pagina) ───────
  function drawHeaderStripe(p: PDFPage) {
    p.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: BRAND_BLUE });
    p.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 2, color: BRAND_ORANGE });
  }

  // ── Texto basico ──────────────────────────────────────────────────────────
  function drawText(text: string, opts: {
    x?: number; size?: number; font?: PDFFont; color?: typeof TEXT; lineGap?: number;
  } = {}) {
    const { x = MARGIN, size = 9, font: f = font, color = TEXT, lineGap = 12 } = opts;
    checkSpace(lineGap);
    page.drawText(text, { x, y, size, font: f, color });
    y -= lineGap;
  }

  // ── Section title con barra naranja a la izquierda ──────────────────────
  function drawSectionHeader(text: string, color: typeof BRAND_BLUE = BRAND_BLUE) {
    checkSpace(36);
    y -= 8;
    // Fondo tinte muy suave
    page.drawRectangle({
      x: MARGIN, y: y - 18, width: CONTENT_W, height: 24,
      color: SURFACE_TINT,
    });
    // Barra de color a la izquierda
    page.drawRectangle({
      x: MARGIN, y: y - 18, width: 4, height: 24,
      color,
    });
    // Texto del titulo
    page.drawText(text, {
      x: MARGIN + 12, y: y - 12,
      size: 11, font: fontBold, color: BRAND_DARK,
    });
    y -= 28;
  }

  // ── Field key-value en linea ──────────────────────────────────────────────
  function drawField(label: string, value: string | null | undefined, opts: { col?: 0 | 1 } = {}) {
    const { col = -1 } = opts as { col?: -1 | 0 | 1 };
    const labelText = label.toUpperCase();
    const valueText = value ?? "—";

    if (col === -1) {
      // single-column layout, ancho completo
      checkSpace(16);
      page.drawText(labelText, { x: MARGIN, y, size: 7, font: fontBold, color: MUTED });
      y -= 10;
      page.drawText(valueText, { x: MARGIN, y, size: 9, font, color: TEXT });
      y -= 10;
      return;
    }

    // 2-column: col 0 izquierda, col 1 derecha
    const colWidth = (CONTENT_W - 16) / 2;
    const xLabel = col === 0 ? MARGIN : MARGIN + colWidth + 16;
    if (col === 0) {
      checkSpace(22);
    }
    page.drawText(labelText, { x: xLabel, y, size: 7, font: fontBold, color: MUTED });
    page.drawText(valueText, { x: xLabel, y: y - 12, size: 9, font, color: TEXT });
    if (col === 1) y -= 22;
  }

  // ── Checklist item ────────────────────────────────────────────────────────
  function drawChecklist(jsonData: Record<string, unknown> | null | undefined) {
    if (!jsonData || typeof jsonData !== "object") return;
    const entries = Object.entries(jsonData);
    if (entries.length === 0) return;

    // 2 columnas
    const colWidth = CONTENT_W / 2;
    const itemHeight = 13;
    const rows = Math.ceil(entries.length / 2);
    checkSpace(rows * itemHeight + 8);

    const startY = y;
    for (let i = 0; i < entries.length; i++) {
      const [key, val] = entries[i];
      const checked = val === true;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = MARGIN + col * colWidth;
      const itemY = startY - row * itemHeight;

      // checkbox
      page.drawRectangle({
        x: x + 2, y: itemY - 8, width: 8, height: 8,
        borderColor: checked ? SUCCESS : MUTED,
        borderWidth: 0.7,
        color: checked ? SUCCESS : undefined,
      });
      if (checked) {
        // tick mark
        page.drawText("✓", { x: x + 3, y: itemY - 7, size: 7, font: fontBold, color: rgb(1, 1, 1) });
      }
      page.drawText(key.replace(/_/g, " "), {
        x: x + 14, y: itemY - 6,
        size: 8, font, color: checked ? TEXT : MUTED,
      });
    }
    y = startY - rows * itemHeight - 6;
  }

  // ── Signature box ─────────────────────────────────────────────────────────
  async function drawSignature(sigData: string | null | undefined, label: string, signedAt?: Date | null) {
    if (!sigData || !sigData.startsWith("data:image")) return;
    const boxH = 64;
    checkSpace(boxH + 18);

    // Caption
    page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 7, font: fontBold, color: MUTED });
    if (signedAt) {
      const dateStr = fmtDateTimeShort(signedAt);
      const dateW = font.widthOfTextAtSize(dateStr, 7);
      page.drawText(dateStr, { x: MARGIN + CONTENT_W - dateW, y, size: 7, font, color: MUTED });
    }
    y -= 10;

    // Box border
    page.drawRectangle({
      x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH,
      borderColor: LINE, borderWidth: 0.7, color: SURFACE_TINT,
    });

    // Signature image centered
    try {
      const base64 = sigData.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const img = await doc.embedPng(bytes);
      const maxH = boxH - 8;
      const maxW = CONTENT_W - 16;
      const scale = Math.min(maxH / img.height, maxW / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, {
        x: MARGIN + (CONTENT_W - w) / 2,
        y: y - boxH + (boxH - h) / 2,
        width: w, height: h,
      });
    } catch {
      page.drawText("(firma no embebible)", { x: MARGIN + 8, y: y - boxH / 2, size: 8, font, color: MUTED });
    }
    y -= boxH + 14;
  }

  // ── Wrap text utility ─────────────────────────────────────────────────────
  function drawWrappedText(text: string, opts: { size?: number; maxChars?: number; color?: typeof TEXT } = {}) {
    const { size = 9, maxChars = 95, color = TEXT } = opts;
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      if ((line + " " + word).length > maxChars) {
        drawText(line, { x: MARGIN, size, font, color });
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) drawText(line, { x: MARGIN, size, font, color });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER
  // ═══════════════════════════════════════════════════════════════════════════
  drawHeaderStripe(page);
  y = PAGE_H - MARGIN - 8;

  // Logo (top-left si existe)
  if (logoImg) {
    const logoH = 56;
    const logoScale = logoH / logoImg.height;
    const logoW = logoImg.width * logoScale;
    page.drawImage(logoImg, {
      x: MARGIN, y: y - logoH + 8,
      width: logoW, height: logoH,
    });

    // Operator info a la derecha del logo
    const infoX = MARGIN + logoW + 20;
    const infoY = y - 4;
    page.drawText(data.tenant.name, {
      x: infoX, y: infoY, size: 14, font: fontBold, color: BRAND_DARK,
    });
    let lineYOffset = 18;
    if (data.tenant.legalName && data.tenant.legalName !== data.tenant.name) {
      page.drawText(data.tenant.legalName, {
        x: infoX, y: infoY - lineYOffset, size: 8, font, color: MUTED,
      });
      lineYOffset += 12;
    }
    const metaParts: string[] = [];
    if (data.tenant.nif) metaParts.push(`NIF: ${data.tenant.nif}`);
    if (data.tenant.operatorRegistrationNumber) metaParts.push(`Reg. AESA: ${data.tenant.operatorRegistrationNumber}`);
    if (metaParts.length > 0) {
      page.drawText(metaParts.join("  ·  "), {
        x: infoX, y: infoY - lineYOffset, size: 8, font: fontMono, color: MUTED,
      });
      lineYOffset += 12;
    }
    if (data.tenant.aesaCsv) {
      page.drawText(`CSV: ${data.tenant.aesaCsv}`, {
        x: infoX, y: infoY - lineYOffset, size: 7, font: fontMono, color: MUTED,
      });
    }
    y -= logoH + 16;
  } else {
    // Fallback sin logo: solo texto
    page.drawText(data.tenant.name, { x: MARGIN, y, size: 18, font: fontBold, color: BRAND_DARK });
    y -= 22;
    if (data.tenant.legalName && data.tenant.legalName !== data.tenant.name) {
      page.drawText(data.tenant.legalName, { x: MARGIN, y, size: 9, font, color: MUTED });
      y -= 14;
    }
    y -= 4;
  }

  // Linea divisoria
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_W, height: 1.5, color: BRAND_BLUE });
  y -= 28;

  // Titulo principal
  page.drawText("DOSSIER DE OPERACION AESA", {
    x: MARGIN, y, size: 22, font: fontBold, color: BRAND_DARK,
  });
  y -= 8;
  page.drawText("Expediente de cumplimiento normativo - Real Decreto 517/2024 - EU 2019/947", {
    x: MARGIN, y: y - 8, size: 8, font, color: MUTED,
  });
  y -= 28;

  // Mission code + name destacado
  page.drawRectangle({
    x: MARGIN, y: y - 50, width: CONTENT_W, height: 56,
    color: SURFACE_TINT, borderColor: BRAND_BLUE, borderWidth: 0.5,
  });
  page.drawRectangle({
    x: MARGIN, y: y - 50, width: 4, height: 56, color: BRAND_BLUE,
  });
  page.drawText(data.mission.code, {
    x: MARGIN + 16, y: y - 14,
    size: 11, font: fontMonoBold, color: BRAND_BLUE,
  });
  page.drawText(data.mission.name, {
    x: MARGIN + 16, y: y - 32,
    size: 14, font: fontBold, color: BRAND_DARK,
  });
  page.drawText(`Estado: ${data.mission.status.toUpperCase()}  ·  Prioridad: ${data.mission.priority.toUpperCase()}`, {
    x: MARGIN + 16, y: y - 46,
    size: 8, font, color: MUTED,
  });
  y -= 70;

  // === DATOS DE LA MISION ===
  drawSectionHeader("DATOS DE LA OPERACION");

  drawField("SORA", data.mission.soraClass, { col: 0 });
  drawField("Ref. EARO", data.mission.earoReference, { col: 1 });

  drawField("Altitud máxima", data.mission.maxAltitude ? `${data.mission.maxAltitude} m AGL` : null, { col: 0 });
  drawField("Coordenadas", data.mission.latitude && data.mission.longitude
    ? `${parseFloat(data.mission.latitude).toFixed(5)}, ${parseFloat(data.mission.longitude).toFixed(5)}`
    : null, { col: 1 });

  drawField("Inicio programado", fmtDateTime(data.mission.scheduledStart), { col: 0 });
  drawField("Fin programado", fmtDateTime(data.mission.scheduledEnd), { col: 1 });

  drawField("Inicio real", fmtDateTime(data.mission.actualStart), { col: 0 });
  drawField("Fin real", fmtDateTime(data.mission.actualEnd), { col: 1 });

  // Subseccion: equipo
  y -= 4;
  drawSectionHeader("EQUIPO Y MEDIO AEREO", BRAND_ORANGE);

  if (data.pilot) {
    drawField("Piloto al mando", data.pilot.userName, { col: 0 });
    drawField("Licencia AESA", data.pilot.pilot.licenseNumber, { col: 1 });
  } else {
    drawField("Piloto al mando", "Sin asignar", { col: 0 });
    drawField("Licencia AESA", null, { col: 1 });
  }
  if (data.drone) {
    drawField("Aeronave", `${data.drone.manufacturer} ${data.drone.model}`, { col: 0 });
    drawField("Numero de serie", data.drone.serialNumber, { col: 1 });
    drawField("Matrícula AESA", data.drone.registrationNumber, { col: 0 });
    drawField("Clase EASA", data.drone.easaClass, { col: 1 });
  } else {
    drawField("Aeronave", "Sin asignar", { col: 0 });
    drawField("Numero de serie", null, { col: 1 });
  }

  if (data.mission.description) {
    y -= 4;
    drawField("Descripción operativa", null);
    drawWrappedText(data.mission.description);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANNING A.4
  // ═══════════════════════════════════════════════════════════════════════════
  if (data.planning) {
    drawSectionHeader("PLANIFICACIÓN OPERACIONAL — Apéndice A.4");
    drawField("Nivel de riesgo", data.planning.riskLevel, { col: 0 });
    drawField("Tipo operación", data.planning.operationType, { col: 1 });
    drawField("Altitud máx. plan.", data.planning.maxAltitude, { col: 0 });
    drawField("RP aprobado", data.planning.rpApproved ? "SÍ" : "NO", { col: 1 });
    drawField("Previsión meteo", data.planning.weatherForecast);

    y -= 6;
    page.drawText("CHECKLIST DE PLANIFICACIÓN", { x: MARGIN, y, size: 7, font: fontBold, color: MUTED });
    y -= 10;
    drawChecklist(data.planning.jsonData as Record<string, unknown>);

    await drawSignature(data.planning.signatureData, "Firma del planificador", data.planning.createdAt);
    if (data.planning.rpSignature) {
      await drawSignature(data.planning.rpSignature, "Firma del Responsable de Operaciones (RP)", data.planning.updatedAt);
    } else if (data.planning.rpApproved) {
      checkSpace(32);
      page.drawRectangle({
        x: MARGIN, y: y - 24, width: CONTENT_W, height: 28,
        color: rgb(0.99, 0.96, 0.85), borderColor: WARN, borderWidth: 0.5,
      });
      page.drawText("Pendiente de firma del Responsable de Operaciones (RP)", {
        x: MARGIN + 12, y: y - 14, size: 9, font: fontBold, color: WARN,
      });
      y -= 36;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFLIGHT A.5/A.6
  // ═══════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < data.preflights.length; i++) {
    const pf = data.preflights[i];
    drawSectionHeader(`CHECKLIST PRE-VUELO #${i + 1} — Apéndice A.5 / A.6`);
    drawField("Fecha", fmtDateTime(pf.createdAt), { col: 0 });
    drawField("Espacio aéreo", pf.airspaceStatus, { col: 1 });

    const wc = pf.weatherConditions as Record<string, unknown> | null;
    if (wc) {
      drawField("Viento", wc.windSpeed != null ? `${wc.windSpeed} km/h` : null, { col: 0 });
      drawField("Temperatura", wc.temperature != null ? `${wc.temperature} °C` : null, { col: 1 });
      drawField("Precipitación", (wc.precipitation as string) ?? null, { col: 0 });
      drawField("Visibilidad", (wc.visibility as string) ?? null, { col: 1 });
    }

    y -= 6;
    page.drawText("VERIFICACIONES", { x: MARGIN, y, size: 7, font: fontBold, color: MUTED });
    y -= 10;
    drawChecklist(pf.jsonData as Record<string, unknown>);
    await drawSignature(pf.signatureData, "Firma del piloto", pf.createdAt);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POSTFLIGHT A.7/A.8
  // ═══════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < data.postflights.length; i++) {
    const pf = data.postflights[i];
    drawSectionHeader(`CHECKLIST POST-VUELO #${i + 1} — Apéndice A.7 / A.8`);
    drawField("Fecha", fmtDateTime(pf.createdAt), { col: 0 });
    drawField("Batería restante", pf.batteryRemaining, { col: 1 });

    y -= 6;
    page.drawText("VERIFICACIONES POST-OPERACIÓN", { x: MARGIN, y, size: 7, font: fontBold, color: MUTED });
    y -= 10;
    drawChecklist(pf.jsonData as Record<string, unknown>);
    await drawSignature(pf.signatureData, "Firma del piloto", pf.createdAt);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INCIDENTS — Anexo I
  // ═══════════════════════════════════════════════════════════════════════════
  if (data.incidents.length > 0) {
    drawSectionHeader("INCIDENTES — Anexo I", BRAND_ORANGE);
    for (const inc of data.incidents) {
      const isNone = inc.incidentType === "none";
      checkSpace(120);

      // Header del incidente con badge
      const badgeColor = isNone ? SUCCESS : DANGER;
      const typeLabel = isNone ? "SIN INCIDENTES — Declaración formal" : inc.incidentType.replace(/_/g, " ").toUpperCase();
      page.drawRectangle({
        x: MARGIN, y: y - 18, width: CONTENT_W, height: 22,
        color: SURFACE_TINT,
      });
      page.drawRectangle({
        x: MARGIN, y: y - 18, width: 3, height: 22, color: badgeColor,
      });
      page.drawText(typeLabel, {
        x: MARGIN + 10, y: y - 12, size: 10, font: fontBold, color: badgeColor,
      });
      const dateStr = fmtDateTime(inc.createdAt);
      const dateW = font.widthOfTextAtSize(dateStr, 8);
      page.drawText(dateStr, { x: MARGIN + CONTENT_W - dateW - 8, y: y - 12, size: 8, font, color: MUTED });
      y -= 28;

      drawField("AESA notificada", inc.aesaNotified ? "SÍ" : "NO");
      drawField("Descripción", null);
      drawWrappedText(inc.description);
      if (inc.actionsTaken) {
        y -= 2;
        drawField("Acciones tomadas", null);
        drawWrappedText(inc.actionsTaken);
      }
      await drawSignature(inc.signatureData, "Firma del informante", inc.createdAt);
      y -= 6;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER en cada pagina
  // ═══════════════════════════════════════════════════════════════════════════
  const pages = doc.getPages();
  const generatedAt = fmtDateTimeShort(new Date());

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    // Stripe en top (solo si la pagina no la tiene aun — la cover ya la dibujo arriba)
    // Comprobamos por si acaso
    drawHeaderStripe(p);

    // Footer line
    p.drawRectangle({
      x: MARGIN, y: 32, width: CONTENT_W, height: 0.5, color: LINE,
    });

    // Left: tenant + reg AESA
    const leftText = data.tenant.operatorRegistrationNumber
      ? `${data.tenant.name}  ·  Reg. AESA ${data.tenant.operatorRegistrationNumber}`
      : data.tenant.name;
    p.drawText(leftText, {
      x: MARGIN, y: 18, size: 7, font, color: MUTED,
    });

    // Center: mission code (mono)
    const codeText = data.mission.code;
    const codeW = fontMono.widthOfTextAtSize(codeText, 7);
    p.drawText(codeText, {
      x: (PAGE_W - codeW) / 2, y: 18, size: 7, font: fontMono, color: BRAND_BLUE,
    });

    // Right: page X/Y
    const pageText = `Pág. ${i + 1} / ${pages.length}`;
    const pageW = fontBold.widthOfTextAtSize(pageText, 7);
    p.drawText(pageText, {
      x: PAGE_W - MARGIN - pageW, y: 18, size: 7, font: fontBold, color: BRAND_DARK,
    });

    // Generated stamp (very small)
    p.drawText(`Generado: ${generatedAt}`, {
      x: MARGIN, y: 8, size: 6, font: fontMono, color: MUTED,
    });
  }

  return doc.save();
}
